# Basic Dither Library

This folder contains a browser-friendly dither plug-in library for general image export.

It is designed to be hosted as static JavaScript files on any public web server, CDN, Git repo raw URL, or local asset pipeline. Nothing in this library requires a build step.

## What It Provides

The entry point is [library.js](./library.js). When loaded in a page that already exposes `window.TPP.registerDitherLibrary`, it registers a catalog of available dithers without loading every dither implementation immediately.

Each dither lives in its own self-contained `plugin.js` file and is loaded only when needed.

Included dithers:

- `threshold`
- `bayer2`
- `bayer4`
- `bayer8`
- `floyd-steinberg`
- `jarvis-judice-ninke`
- `stucki`
- `burkes`
- `sierra`
- `atkinson`
- `halftone`
- `blue-noise`
- `random`
- `pattern`

## How To Host It

Host this folder so the files keep their relative paths intact. For example:

```text
https://example.com/dithers/basic/library.js
https://example.com/dithers/basic/threshold/plugin.js
https://example.com/dithers/basic/bayer4/plugin.js
```

The relative URLs inside `library.js` are resolved from the URL used to load the library.

## How To Use It

Your application should provide:

- `window.TPP.registerDitherLibrary(library)`
- `window.TPP.registerDither(dither)`

Then load the library:

```html
<script src="https://example.com/dithers/basic/library.js"></script>
```

When `library.js` runs, it calls `window.TPP.registerDitherLibrary(...)` with metadata such as:

- `id`
- `name`
- `kind`
- `url`

Your app can then lazy-load the individual `plugin.js` files later.

## Expected Plug-in Shape

Each plug-in registers itself like this:

```js
window.TPP.registerDither({
  id: "threshold",
  name: "Threshold",
  kind: "both",
  applyMono: function (data, width, height, options) {
    // ...
  },
  applyPalette: function (data, width, height, palette, options) {
    // ...
  },
});
```

Supported handlers:

- `applyMono(data, width, height, options)`
- `applyPalette(data, width, height, palette, options)`
- `applyPaletteAsync(data, width, height, palette, options)`

## Notes

- The library is intentionally quiet for end users.
- If registration fails, errors are written to `console.error`.
- Because each dither is self-contained, you can also load a single plug-in directly without loading `library.js` first, as long as `window.TPP.registerDither` already exists.
