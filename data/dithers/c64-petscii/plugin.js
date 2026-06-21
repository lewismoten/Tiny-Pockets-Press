(function () {
  const name = "C64 Blocks";
  const baseMessage = `Dither "${name}" could not register.`;
  const logError = function (message, err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      if (arguments.length > 1) console.error(message, err);
      else console.error(message);
    }
  };
  const registerDither = window.TPP && window.TPP.registerDither;
  if (typeof registerDither !== "function") {
    logError(`${baseMessage} TPP.registerDither not found.`);
    return;
  }
  const supportUrl =
    typeof document !== "undefined" && document.currentScript && document.currentScript.src
      ? new URL("../c64-support.js", document.currentScript.src).toString()
      : "";
  const loadSupport = function () {
    if (!window.TPP) {
      return Promise.reject(new Error("TPP not found."));
    }
    if (window.TPP.imageExportC64DitherSupport) {
      return Promise.resolve(window.TPP.imageExportC64DitherSupport);
    }
    if (!supportUrl) {
      return Promise.reject(new Error("C64 dither support URL not found."));
    }
    if (!window.TPP.imageExportC64DitherSupportPromise) {
      window.TPP.imageExportC64DitherSupportPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = supportUrl;
        script.async = true;
        script.dataset.tppC64DitherSupport = "true";
        script.onload = function () {
          if (window.TPP && window.TPP.imageExportC64DitherSupport) {
            resolve(window.TPP.imageExportC64DitherSupport);
            return;
          }
          reject(new Error("C64 dither support did not initialize."));
        };
        script.onerror = function () {
          reject(new Error("C64 dither support failed to load."));
        };
        document.head.appendChild(script);
      }).catch(function (err) {
        window.TPP.imageExportC64DitherSupportPromise = null;
        throw err;
      });
    }
    return window.TPP.imageExportC64DitherSupportPromise;
  };
  try {
    registerDither({
      id: "c64-petscii",
      name: name,
      kind: "palette",
      applyPaletteAsync: async function (data, width, height, palette, options) {
        const support = await loadSupport();
        await support.applyPalettePetsciiAsync(data, width, height, palette, support.petsciiGlyphs, "blocks", options);
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
