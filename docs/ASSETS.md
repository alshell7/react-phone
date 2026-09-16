# Documentation assets

## Repository banner

- File: `public/media/repository-banner.png`
- Created with the built-in imagegen tool; no external image API key used.
- Use: README and Starlight introduction / social preview.
- License: included under the repository's MIT license.
- Generation prompt: [banner-prompt.txt](./banner-prompt.txt).

## Screenshots

All screenshots in `public/media/` are captures of this repository's working React UI, using explicit Preview mode, synthetic caller data, and no account credentials. Regenerate with `npm run dev`, then `npm run docs:screenshots`.

## Mermaid diagrams

`diagrams/*.mmd` contains the editable sources. `public/diagrams/*.svg` contains static rendered output. Regenerate with `npm run docs:diagrams` after installing documentation dependencies and Playwright Chromium.
