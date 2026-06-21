# ZIP Storage Medium

This folder contains a browser-ready storage plug-in that registers a `zip` storage medium with the TPP API.

It is meant to be hostable as static JavaScript from any public URL, local asset pipeline, or CDN. It does not depend on Tiny Pockets Press by name, but it does depend on a host exposing the TPP storage API and a ZIP export core.

## What It Registers

The entry point is [plugin.js](./plugin.js).

When loaded, it calls:

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

The storage medium id is:

```text
zip
```

## Required Host API

The host application must provide:

- `window.TPP.registerStorage(storage)`
- `window.TPP.exportImagesZipCore(options)`

In practice, the host's ZIP core is also responsible for any dependencies needed to produce the final archive, such as rendering, file generation, `JSZip`, and download behavior.

## What This Plug-in Relies On

This plug-in is intentionally thin. It does not:

- render pages
- gather source files
- build ZIP entries by itself
- trigger its own download logic

It only registers the storage medium and forwards `options` to the host:

```js
await storage.export(options);
```

## `export(options)` Signature

The plug-in forwards a single `options` object unchanged to:

```js
window.TPP.exportImagesZipCore(options)
```

That means the real accepted shape is defined by the host.

For a generic storage-medium contract, these fields are recommended to be shared across both `zip` and `d64`:

```ts
type StorageExportOptions = {
  files?: StorageFile[];
  getFiles?: () => StorageFile[] | Promise<StorageFile[]>;
  metadata?: Record<string, unknown>;
  options?: Record<string, unknown>;
  onProgress?: (detail: unknown) => void;
  signal?: AbortSignal;
};

type StorageFile = {
  name: string;
  bytes?: Uint8Array | ArrayBuffer;
  blob?: Blob;
  text?: string;
  data?: unknown;
  type?: string;
  metadata?: Record<string, unknown>;
};
```

## Shared Option Guidance

These shared fields are a good baseline for any storage medium:

- `files`: a prebuilt list of files the storage medium should package
- `getFiles`: a lazy callback the host can expose instead of precomputing `files`
- `metadata`: generic metadata about the export, book, project, or archive
- `options`: medium-specific settings nested under one property instead of polluting the top level
- `onProgress`: optional callback for status updates
- `signal`: optional cancellation signal

For compatibility, `files` and `getFiles` should be treated as alternate ways of providing the same data, with `getFiles` being preferred when lazy generation is useful.

## Current Tiny Pockets Press Behavior

In this repository, the current ZIP storage medium still delegates to a Tiny Pockets Press host-specific export core. That core primarily works from the active book state and image export settings, for example:

- `format`
- `dpi`
- `targetWidth`
- `targetHeight`
- `colorDepth`
- `palette`
- `threshold`
- `dithering`
- `preDitherEnabled`
- `preDither`
- `preDitherThreshold`

So while `files` and `getFiles` are recommended shared parameters for a generic host, they are not yet the primary contract used by this specific implementation.

## How To Load It

Load the plug-in after the host has created `window.TPP`:

```html
<script src="https://example.com/storage/zip/plugin.js"></script>
```

After that, the host should be able to resolve the storage medium by id `zip`.

## Notes

- Registration failures are reported with `console.error`.
- The plug-in is designed so the ZIP storage medium can live in its own repo and still depend on a shared TPP host API.
