# Palette Plugins

Each palette can now be loaded from a public URL.

The project is moving toward JavaScript-only palette plugins. Each palette should be a `.js` file that registers itself at runtime.

Palette discovery is loaded by default from `https://git.lewismoten.com/tiny-pockets-press/palette-lib/raw/branch/main/library.js`, which calls `TPP.registerPaletteLibrary(...)` with the list of available palettes and their retrieval URLs. The app uses that library as a lazy-load registry before fetching an individual palette script.

The local [library.js](./library.js) file remains as a compatible fallback/development copy of that registry shape.

The catalog in [../palettes.catalog.json](../palettes.catalog.json) accepts entries like:

```json
{
  "id": "c64",
  "name": "Commodore 64",
  "url": "https://cdn.example.com/palettes/c64.js",
  "colorCount": 16,
  "description": "The standard 16-color Commodore 64 palette derived from the VIC-II graphics chip."
}
```

JavaScript plugins should call the global palette API:

```js
(function () {
  const name = "Commodore 64";
  const baseMessage = `Palette "${name}" could not register.`;
  const logError = function (message, err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      if (arguments.length > 1) console.error(message, err);
      else console.error(message);
    }
  };
  const registerPalette = window.TPP && window.TPP.registerPalette;
  if (typeof registerPalette !== "function") {
    logError(`${baseMessage} TPP.registerPalette not found.`);
    return;
  }
  try {
    registerPalette({
      schemaVersion: 1,
      id: "c64",
      name: name,
      description: "The standard 16-color Commodore 64 palette derived from the VIC-II graphics chip.",
      colorNumbers: [0, 1, 2, 3],
      colorNames: [
        "black",
        "white",
        "red",
        "cyan"
      ],
      colors: [
        "#000000",
        "#ffffff",
        "#813338",
        "#75cec8"
      ]
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
```

Runtime API:

- `TPP.registerPalette(plugin)` registers a palette plugin.
- `TPP.registerPaletteLibrary({ palettes })` registers the available palette library for lazy loading.
- `TPP.imageExportPalettePluginApi.get(id)` returns `id`, `name`, `description`, `colorCount`, `sourceUrl`, `colors`, `hexColors`, `colorNames`, and `colorNumbers`.
- `TPP.imageExportPalettePluginApi.list()` returns all loaded palette plugin records.
- `TPP.imageExportPaletteMetadata(id)` returns the same metadata for a single palette when available.
