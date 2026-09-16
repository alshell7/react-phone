/** Verify the actual JSR npm artifact in a fresh, independent React app. */
import { mkdtemp, cp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const version = process.env.PHONE_PACKAGE_VERSION || manifest.version;
const cwd = await mkdtemp(path.join(tmpdir(), 'azeer-phone-consumer-'));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check with npm run test:consumer.');
await cp(new URL('tests/consumer/', root), cwd, { recursive: true });
await writeFile(path.join(cwd, '.npmrc'), '@jsr:registry=https://npm.jsr.io\n');
await writeFile(path.join(cwd, 'package.json'), JSON.stringify({
  name: 'azeer-phone-consumer-smoke', private: true, type: 'module',
  dependencies: {
    [manifest.name]: `npm:@jsr/azeer-ui-widget__react-phone@${version}`,
    react: '^19.0.0', 'react-dom': '^19.0.0',
  },
  devDependencies: Object.fromEntries(['@types/react', '@types/react-dom', 'vite', '@vitejs/plugin-react', 'typescript'].map(name => [name, manifest.devDependencies[name]])),
}, null, 2));

const run = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [npmCli, ...args], { cwd, stdio: 'inherit', windowsHide: true });
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} exited ${code}`)));
});
console.log(`Testing published ${manifest.name}@${version} in ${cwd}`);
await run(['install', '--no-fund']);
await run(['exec', '--', 'tsc', '--noEmit']);
await run(['exec', '--', 'vite', 'build']);

// Import Vite from the consumer, avoiding any root-project module aliases.
const { preview } = await import(pathToFileURL(path.join(cwd, 'node_modules/vite/dist/node/index.js')).href);
const server = await preview({ root: cwd, preview: { host: '127.0.0.1', port: 0, open: false } });
const address = server.httpServer.address();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}`);
  const shell = page.locator('.az-island-shell');
  await expect(shell).toHaveAttribute('data-expanded', 'false');
  await page.getByRole('button', { name: 'Simulate incoming' }).click();
  await expect(shell).toHaveAttribute('data-expanded', 'false');
  await page.getByRole('button', { name: 'Answer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mute', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'End call', exact: true }).click();
  await expect(shell).toHaveAttribute('data-expanded', 'false');
  await page.locator('.az-island-trigger').click();
  await page.getByRole('button', { name: /Start call/ }).click();
  await expect(page.getByRole('button', { name: 'Mute', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: /Voice orb/ })).toHaveAttribute('data-renderer', 'webgl');
  await page.getByRole('button', { name: 'Collapse phone' }).click();
  await expect(shell).toHaveAttribute('data-expanded', 'false');
  await expect(shell).toContainText('In conversation');
  await page.getByRole('button', { name: 'Open call' }).click();
  await page.getByRole('button', { name: 'End call', exact: true }).click();
  await expect(shell).toHaveAttribute('data-expanded', 'false');
  expect(await page.evaluate(() => window.consumerEvents)).toEqual(['answered', 'disconnected', 'answered', 'disconnected']);
  expect(errors).toEqual([]);
  console.log('Published consumer passed: strict declarations, build, shared React, incoming/outgoing preview calls, Orb, collapse persistence, lifecycle callbacks.');
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
