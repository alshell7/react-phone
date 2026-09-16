import { cp, writeFile, access } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await access(new URL("dist/index.html", root));
await access(new URL("docs/dist/index.html", root));
await cp(new URL("dist/", root), new URL("docs/dist/playground/", root), {
  recursive: true,
});
await writeFile(new URL("docs/dist/.nojekyll", root), "");
console.log("Documentation and playground assembled in docs/dist.");
