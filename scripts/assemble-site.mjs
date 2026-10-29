import { cp, writeFile, access } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await access(new URL("dist/index.html", root));
await access(new URL("docs/dist/index.html", root));
await cp(new URL("dist/", root), new URL("docs/dist/playground/", root), {
  recursive: true,
});
// React Native playground (Expo web export built with EXPO_BASE_URL=/react-phone/native/playground).
await access(new URL("native/example/dist/index.html", root));
await cp(
  new URL("native/example/dist/", root),
  new URL("docs/dist/native/playground/", root),
  { recursive: true },
);
await writeFile(new URL("docs/dist/.nojekyll", root), "");
console.log("Documentation and playgrounds assembled in docs/dist.");
