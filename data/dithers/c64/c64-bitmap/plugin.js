(function () {
  const name = "C64 Bitmap";
  const description =
    "Approximates C64 hi-res bitmap mode with two colors per 8x8 cell.";
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
    typeof document !== "undefined" &&
    document.currentScript &&
    document.currentScript.src
      ? new URL("../c64-support.js", document.currentScript.src).toString()
      : "";
  const loadSupport = function () {
    if (!window.C64) {
      window.C64 = {};
    }
    if (window.C64.dither) {
      return Promise.resolve(window.C64.dither);
    }
    if (!supportUrl) {
      return Promise.reject(new Error("C64 dither support URL not found."));
    }
    if (!window.C64.ditherPromise) {
      window.C64.ditherPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = supportUrl;
        script.async = true;
        script.dataset.tppC64DitherSupport = "true";
        script.onload = function () {
          if (window.C64 && window.C64.dither) {
            resolve(window.C64.dither);
            return;
          }
          reject(new Error("C64 dither support did not initialize."));
        };
        script.onerror = function () {
          reject(new Error("C64 dither support failed to load."));
        };
        document.head.appendChild(script);
      }).catch(function (err) {
        window.C64.ditherPromise = null;
        throw err;
      });
    }
    return window.C64.ditherPromise;
  };
  try {
    registerDither({
      id: "c64-bitmap",
      name: name,
      kind: "palette",
      description: description,
      applyPaletteAsync: async function (data, width, height, palette, options) {
        const support = await loadSupport();
        await support.applyPaletteBitmapAsync(
          data,
          width,
          height,
          palette,
          options,
        );
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
