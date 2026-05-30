# Tiny Pockets Press v6.1

This is a syntax-corrected build of v6.

## Run locally

Start a localhost server with:

```sh
npm run localhost
```

By default the app will be available at `http://127.0.0.1:3000`.

## Fixes in v6.1

- Rebuilt JavaScript modules to avoid invalid escaped strings and broken regex literals.
- Added `node --check` validation during packaging.
- Keeps JavaScript modular:
  - `config.js`
  - `state.js`
  - `markdown-media.js`
  - `layout-engine.js`
  - `render-page.js`
  - `imposition.js`
  - `library.js`
  - `editor.js`
  - `export.js`
  - `app.js`
- Keeps the uploaded sample book in `data/sample-book.json`.
- Maintains separate interior and cover print/PDF views.
