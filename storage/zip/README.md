# ZIP Storage Medium

This folder contains a browser-ready storage plug-in that exports rendered page images into a ZIP archive.

It is intended to be hostable as static JavaScript from any public URL, local asset pipeline, or CDN. It does not require Tiny Pockets Press specifically, but it does depend on a host application exposing the `TPP` API used by the plug-in.

## What It Provides

The entry point is [plugin.js](./plugin.js).

When loaded, it registers a storage medium through:

```js
window.TPP.registerStorage(...)
```

The storage medium id is:

```text
zip
```

## Required Host API

The host application must provide:

- `window.TPP.registerStorage(storage)`
- `window.TPP.exportImagesZipCore(options)`

The plug-in does not implement image rendering itself. It delegates to the host application's ZIP export core.

## How To Use It

Load the plug-in after the host has created `window.TPP`:

```html
<script src="https://example.com/storage/zip/plugin.js"></script>
```

After that, the host should be able to resolve the registered storage medium by id `zip`.

## Registered Shape

The plug-in registers an object similar to:

```js
window.TPP.registerStorage({
  id: "zip",
  name: "ZIP Archive",
  description: "Exports rendered page images into a ZIP archive.",
  export: async function (options) {
    return window.TPP.exportImagesZipCore(options || {});
  },
});
```

## Notes

- Registration failures are reported with `console.error`.
- This plug-in is intentionally thin so the ZIP medium can live in its own repo while still depending on a shared `TPP` host API.
