/**
 * Stage the JSR package in .jsr-stage/ with only its publishable files and runtime
 * dependencies. Publishing from native/ directly would make Deno resolve the Expo
 * example workspace and every dev dependency, which is slow and unnecessary.
 *
 *   node scripts/stage-jsr.mjs && cd .jsr-stage && npx jsr publish
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const stage = new URL(".jsr-stage/", root);
const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const jsr = JSON.parse(await readFile(new URL("jsr.json", root), "utf8"));
if (manifest.version !== jsr.version)
  throw new Error(`package.json (${manifest.version}) and jsr.json (${jsr.version}) versions differ.`);

await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
for (const file of ["publish", "README.md", "CHANGELOG.md", "LICENSE", "jsr.json"])
  await cp(new URL(file, root), new URL(file, stage), { recursive: true });
await writeFile(
  new URL("package.json", stage),
  JSON.stringify(
    {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      license: manifest.license,
      type: "module",
      // Lets the example bundle the staged files (PHONE_PACKAGE=staged); JSR uses jsr.json.
      exports: jsr.exports,
      dependencies: manifest.dependencies,
      peerDependencies: manifest.peerDependencies,
      // Deno resolves bare imports from dependencies/devDependencies (not peers) and
      // only accepts space-free ranges in import specifiers. JSR's npm bridge copies these
      // ranges, so keep them wide: a narrow range would make npm nest a second React Native.
      devDependencies: {
        react: "19.x",
        "@types/react": "^19.0.0",
        "react-native": "0.x",
        "react-native-svg": "15.x",
        "react-native-webrtc": "124 - 999",
      },
    },
    null,
    2,
  ) + "\n",
);
console.log(`Staged ${jsr.name}@${jsr.version} in ${stage.pathname}`);
