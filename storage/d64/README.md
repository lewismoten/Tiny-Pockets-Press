# Commodore 64 D64 Storage Medium

This folder contains a browser-ready storage plug-in that registers a `d64` storage medium with the TPP API.

It is designed to be hosted independently as static JavaScript. It does not depend on Tiny Pockets Press by name, but it does depend on a host exposing the TPP storage API and a Commodore 64 D64 export core.

## What It Registers

The entry point is [plugin.js](./plugin.js).

When loaded, it calls:

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

The storage medium id is:

```text
d64
```

## Required Host API

The host application must provide:

- `window.TPP.registerStorage(storage)`
- `window.TPP.exportImagesD64Core(options)`

In practice, the host's D64 core is also responsible for Commodore 64 rendering, disk layout, disk-image generation, optional multi-disk ZIP bundling, and download behavior.

## What This Plug-in Relies On

This plug-in is intentionally thin. It does not:

- convert source content into C64 screen data
- choose palette or dithering rules
- assign files to D64 disks
- build D64 filesystem sectors
- trigger its own download logic

It only registers the storage medium and forwards `options` to the host:

```js
await storage.export(options);
```

## `export(options)` Signature

The plug-in forwards a single `options` object unchanged to:

```js
window.TPP.exportImagesD64Core(options)
```

That means the real accepted shape is defined by the host.

For a generic storage-medium contract, these fields are recommended to be shared across both `d64` and `zip`:

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

- `files`: a prebuilt list of files or logical assets the medium should package
- `getFiles`: a lazy callback the host can expose instead of precomputing `files`
- `metadata`: generic metadata about the export, title, or bundle
- `options`: medium-specific settings nested under one property
- `onProgress`: optional callback for status updates
- `signal`: optional cancellation signal

For D64 specifically, `files` may represent either raw output files or higher-level logical assets that the host's D64 core converts into disk records.

## Current Tiny Pockets Press Behavior

In this repository, the current D64 storage medium still delegates to a Tiny Pockets Press host-specific export core. That implementation is driven primarily by the active book state and C64 export settings rather than a generic `files` array.

Common host-side options currently involved in the D64 flow include:

- `format`
- `colorDepth`
- `palette`
- `threshold`
- `dithering`
- `preDitherEnabled`
- `preDither`
- `preDitherThreshold`

The current host also forces C64-oriented export behavior, such as:

- `format: "d64"`
- `palette: "c64"`
- target size appropriate for Commodore 64 graphics

So while `files` and `getFiles` are recommended shared parameters for a generic host, they are not yet the primary contract used by this specific implementation.

## How To Load It

Load the plug-in after the host has created `window.TPP`:

```html
<script src="https://example.com/storage/d64/plugin.js"></script>
```

After that, the host should be able to resolve the storage medium by id `d64`.

## Notes

- Registration failures are reported with `console.error`.
- The plug-in is designed so the D64 storage medium can live in its own repo and still depend on a shared TPP host API.
