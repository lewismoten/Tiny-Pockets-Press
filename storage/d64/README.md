# Commodore 64 D64 Storage Medium

This folder contains a browser-ready storage plug-in that exports rendered book data into Commodore 64 `D64` disk images.

It is designed to be hosted independently as static JavaScript. It does not require Tiny Pockets Press specifically, but it assumes the host application exposes the `TPP` API used by the plug-in.

## What It Provides

The entry point is [plugin.js](./plugin.js).

When loaded, it registers a storage medium through:

```js
window.TPP.registerStorage(...)
```

The storage medium id is:

```text
d64
```

## Required Host API

The host application must provide:

- `window.TPP.registerStorage(storage)`
- `window.TPP.exportImagesD64Core(options)`

The plug-in does not implement C64 rendering or disk packing by itself. It delegates to the host application's D64 export core.

## How To Use It

Load the plug-in after the host has created `window.TPP`:

```html
<script src="https://example.com/storage/d64/plugin.js"></script>
```

After that, the host should be able to resolve the registered storage medium by id `d64`.

## Registered Shape

The plug-in registers an object similar to:

```js
window.TPP.registerStorage({
  id: "d64",
  name: "Commodore 64 D64",
  description: "Exports rendered page graphics and assets into Commodore 64 disk images.",
  export: async function (options) {
    return window.TPP.exportImagesD64Core(options || {});
  },
});
```

## Notes

- Registration failures are reported with `console.error`.
- This plug-in is intentionally thin so the D64 medium can live in its own repo while still depending on a shared `TPP` host API.
