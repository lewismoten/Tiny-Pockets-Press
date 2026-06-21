# C64 Dither Library

This folder contains C64-specific dithers and helper APIs for browser-based image export.

It is intended to work as a separate library from the basic dithers so C64 features can carry their own helper surface under `window.C64.dither`.

## What It Provides

The entry point is [library.js](./library.js). When loaded in a page that already exposes `window.TPP.registerDitherLibrary`, it registers the C64 dither catalog without eagerly loading every implementation.

The individual C64 plug-ins then lazy-load [c64-support.js](./c64-support.js), which sets up:

```js
window.C64.dither
```

That API exposes shared C64 helper methods and glyph catalogs used by the C64 dithers.

Included dithers:

- `c64-petscii` as `C64 Blocks`
- `c64-charset-unshifted` as `C64 Default Charset`
- `c64-charset-shifted-business` as `C64 Shifted Business Charset`
- `c64-custom-charset` as `C64 Custom Charset`

## How To Host It

Host this folder structure as-is so the relative paths remain valid. For example:

```text
https://example.com/dithers/c64/library.js
https://example.com/dithers/c64/c64-support.js
https://example.com/dithers/c64/c64-petscii/plugin.js
https://example.com/dithers/c64/c64-charset-unshifted/plugin.js
```

The library file references sibling and parent-relative plug-in paths, so preserving structure matters.

## How To Use It

Your application should provide:

- `window.TPP.registerDitherLibrary(library)`
- `window.TPP.registerDither(dither)`

Then load the C64 library:

```html
<script src="https://example.com/dithers/c64/library.js"></script>
```

That registers the available C64 dithers. Later, when your app loads one of the individual plug-ins, that plug-in will load `c64-support.js` on demand and use `window.C64.dither`.

## The `window.C64.dither` API

After a C64 plug-in loads its support file, these helpers become available:

- `window.C64.dither.applyPalettePetsciiAsync(...)`
- `window.C64.dither.applyPaletteCustomCharsetAsync(...)`
- `window.C64.dither.buildImageExportCustomCharsetSheet(...)`
- `window.C64.dither.buildC64CustomCharsetLayout(...)`
- `window.C64.dither.petsciiGlyphs`
- `window.C64.dither.c64CharsetUnshiftedGlyphs`
- `window.C64.dither.c64CharsetShiftedBusinessGlyphs`

This API is meant for browser use and for reuse by related C64 plug-ins.

## Plug-in Behavior

Each C64 dither plug-in:

- registers itself through `window.TPP.registerDither(...)`
- loads `c64-support.js` only when the dither is actually needed
- reads helper methods and glyph catalogs from `window.C64.dither`

That keeps the C64 library lazy-loaded while still exposing a reusable public helper API.

## Notes

- The default and shifted-business charsets use hard-coded glyph catalogs extracted from the source C64 sheets already included with this project.
- The lower reverse-video half of those sheets is not duplicated in the baked glyph list because the top half provides the unique glyph shapes needed for dithering.
- If registration or helper loading fails, errors are written to `console.error`.
