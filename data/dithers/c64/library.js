(function () {
  const registerDitherLibrary =
    window.TPP && window.TPP.registerDitherLibrary;
  if (typeof registerDitherLibrary !== "function") {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "C64 dither library could not register. TPP.registerDitherLibrary not found.",
      );
    }
    return;
  }
  registerDitherLibrary({
    baseUrl:
      (typeof document !== "undefined" &&
      document.currentScript &&
      document.currentScript.src) ||
      "",
    dithers: [
      { id: "c64-bitmap", name: "C64 Bitmap", url: "c64-bitmap/plugin.js", kind: "palette" },
      { id: "c64-petscii", name: "C64 Blocks", url: "c64-petscii/plugin.js", kind: "palette" },
      { id: "c64-charset-unshifted", name: "C64 Default Charset", url: "c64-charset-unshifted/plugin.js", kind: "palette" },
      { id: "c64-charset-shifted-business", name: "C64 Shifted Business Charset", url: "c64-charset-shifted-business/plugin.js", kind: "palette" },
      { id: "c64-custom-charset", name: "C64 Custom Charset", url: "c64-custom-charset/plugin.js", kind: "palette" }
    ],
  });
})();
