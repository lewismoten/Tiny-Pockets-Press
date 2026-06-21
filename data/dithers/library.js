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
      { id: "threshold", name: "Threshold", url: "threshold/plugin.js", kind: "both" },
      { id: "bayer2", name: "Bayer 2x2", url: "bayer2/plugin.js", kind: "both" },
      { id: "bayer4", name: "Bayer 4x4", url: "bayer4/plugin.js", kind: "both" },
      { id: "bayer8", name: "Bayer 8x8", url: "bayer8/plugin.js", kind: "both" },
      { id: "floyd-steinberg", name: "Floyd-Steinberg", url: "floyd-steinberg/plugin.js", kind: "both" },
      { id: "jarvis-judice-ninke", name: "Jarvis Judice & Ninke", url: "jarvis-judice-ninke/plugin.js", kind: "both" },
      { id: "stucki", name: "Stucki", url: "stucki/plugin.js", kind: "both" },
      { id: "burkes", name: "Burkes", url: "burkes/plugin.js", kind: "both" },
      { id: "sierra", name: "Sierra", url: "sierra/plugin.js", kind: "both" },
      { id: "atkinson", name: "Atkinson", url: "atkinson/plugin.js", kind: "both" },
      { id: "halftone", name: "Halftone", url: "halftone/plugin.js", kind: "both" },
      { id: "blue-noise", name: "Blue-noise", url: "blue-noise/plugin.js", kind: "both" },
      { id: "random", name: "Random", url: "random/plugin.js", kind: "both" },
      { id: "pattern", name: "Pattern", url: "pattern/plugin.js", kind: "both" }
    ],
  });
})();
