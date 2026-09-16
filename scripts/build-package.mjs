/**
 * JSR's npm bridge currently leaves TSX modules as source with npm: imports.
 * Lower JSX to runtime calls while retaining TypeScript annotations and JSDoc.
 * Commit this deterministic tree so the requested `npx jsr publish` workflow
 * works without a build step. Edit src/, then run `npm run package:build`.
 */
import { transformAsync } from '@babel/core';
import transformJSX from '@babel/plugin-transform-react-jsx';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const source = new URL('src/', root);
const target = new URL('publish/', root);
const check = process.argv.includes('--check');
const normalize = (text) => text.replaceAll('\r\n', '\n');
const files = await readdir(source, { recursive: true });
const expected = new Set();
let count = 0;
for (const file of files.filter(f => /\.tsx?$/.test(f)).sort()) {
  const input = normalize(await readFile(new URL(file.replaceAll('\\', '/'), source), 'utf8'));
  const filename = file.replaceAll('\\', '/');
  const outputFile = filename.replace(/\.tsx$/, '.ts');
  expected.add(outputFile);
  const result = await transformAsync(input, {
    filename, babelrc: false, configFile: false, comments: true,
    parserOpts: { sourceType: 'module', plugins: ['typescript', 'jsx'] },
    plugins: [
      [transformJSX, { runtime: 'automatic', importSource: 'react' }],
      () => ({ visitor: { StringLiteral(path) {
        if (path.node.value.startsWith('.') && path.node.value.endsWith('.tsx')) {
          path.node.value = path.node.value.replace(/\.tsx$/, '.ts');
        }
      } } }),
    ],
  });
  const output = `// Generated from src/${filename}. Run npm run package:build; do not edit.\n${result.code}\n`;
  const destination = new URL(outputFile, target);
  if (check) {
    const existing = await readFile(destination, 'utf8').catch(() => '');
    if (normalize(existing) !== output) throw new Error(`Stale publish/${outputFile}. Run npm run package:build.`);
  } else {
    await mkdir(new URL('./', destination), { recursive: true });
    await writeFile(destination, output);
  }
  count++;
}
const extras = (await readdir(target, { recursive: true })).filter(f => /\.tsx?$/.test(f) && !expected.has(f.replaceAll('\\', '/')));
if (extras.length) throw new Error(`Remove obsolete generated files: ${extras.join(', ')}`);
console.log(`${check ? 'Verified' : 'Generated'} ${count} JSX-free TypeScript modules in ${fileURLToPath(target)}.`);
