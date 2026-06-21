(function () {
  const registerDitherLibrary =
    window.TPP && window.TPP.registerDitherLibrary;
  if (typeof registerDitherLibrary !== "function") {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "Dither library could not register. TPP.registerDitherLibrary not found.",
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
      { id: "threshold", name: "Threshold", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "bayer2", name: "Bayer 2x2", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "bayer4", name: "Bayer 4x4", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "bayer8", name: "Bayer 8x8", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "floyd-steinberg", name: "Floyd-Steinberg", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "jarvis-judice-ninke", name: "Jarvis Judice & Ninke", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "stucki", name: "Stucki", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "burkes", name: "Burkes", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "sierra", name: "Sierra", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "atkinson", name: "Atkinson", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "halftone", name: "Halftone", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "blue-noise", name: "Blue-noise", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "random", name: "Random", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "pattern", name: "Pattern", module: "../../js/image-export-dither.js", kind: "both" },
      { id: "c64-petscii", name: "C64 PETSCII Blocks", module: "../../js/image-export-dither.js", kind: "palette" },
      { id: "c64-petscii-full", name: "C64 PETSCII Full Charset", module: "../../js/image-export-dither.js", kind: "palette" },
      { id: "c64-custom-charset", name: "C64 Custom Charset", module: "../../js/image-export-dither.js", kind: "palette" }
    ],
  });
})();
