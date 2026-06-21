(function () {
  const registerStorageLibrary =
    window.TPP && window.TPP.registerStorageLibrary;
  if (typeof registerStorageLibrary !== "function") {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "Storage library could not register. TPP.registerStorageLibrary not found.",
      );
    }
    return;
  }
  registerStorageLibrary({
    baseUrl:
      (typeof document !== "undefined" &&
      document.currentScript &&
      document.currentScript.src) ||
      "",
    storage: [
      {
        id: "zip",
        name: "ZIP Archive",
        url: "zip/plugin.js",
        description: "Exports rendered page images into a ZIP archive.",
      },
      {
        id: "d64",
        name: "Commodore 64 D64",
        url: "d64/plugin.js",
        description: "Exports rendered page graphics and assets into Commodore 64 disk images.",
      },
    ],
  });
})();
