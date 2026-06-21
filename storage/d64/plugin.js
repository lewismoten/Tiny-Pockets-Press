(function () {
  const name = "Commodore 64 D64";
  const description =
    "Exports rendered page graphics and assets into Commodore 64 disk images.";
  const baseMessage = `Storage medium "${name}" could not register.`;
  const supportUrl =
    typeof document !== "undefined" && document.currentScript && document.currentScript.src
      ? new URL("./support.js", document.currentScript.src).toString()
      : "support.js";
  const logError = function (message, err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      if (arguments.length > 1) console.error(message, err);
      else console.error(message);
    }
  };
  const ensureSupport = function () {
    if (
      window.TPP &&
      typeof window.TPP.buildD64Image === "function" &&
      typeof window.TPP.d64EstimateImageUsage === "function" &&
      typeof window.TPP.exportD64FileName === "function" &&
      typeof window.TPP.exportD64DiskFileName === "function"
    ) {
      return Promise.resolve();
    }
    if (window.TPP && window.TPP.d64StorageSupportLoadPromise) {
      return window.TPP.d64StorageSupportLoadPromise;
    }
    const promise = new Promise(function (resolve, reject) {
      if (typeof document === "undefined") {
        reject(new Error("Document not available for D64 support loading."));
        return;
      }
      const script = document.createElement("script");
      script.src = supportUrl;
      script.async = true;
      script.onload = function () {
        if (
          window.TPP &&
          typeof window.TPP.buildD64Image === "function" &&
          typeof window.TPP.d64EstimateImageUsage === "function" &&
          typeof window.TPP.exportD64FileName === "function" &&
          typeof window.TPP.exportD64DiskFileName === "function"
        ) {
          resolve();
          return;
        }
        reject(new Error("D64 support script loaded without required helpers."));
      };
      script.onerror = function () {
        reject(new Error("D64 support script load failed."));
      };
      document.head.appendChild(script);
    })
      .catch(function (err) {
        logError(`${baseMessage} Support script could not load.`, err);
        throw err;
      })
      .finally(function () {
        if (window.TPP) delete window.TPP.d64StorageSupportLoadPromise;
      });
    if (window.TPP) {
      window.TPP.d64StorageSupportLoadPromise = promise;
    }
    return promise;
  };
  const registerStorage = window.TPP && window.TPP.registerStorage;
  if (typeof registerStorage !== "function") {
    logError(`${baseMessage} TPP.registerStorage not found.`);
    return;
  }
  try {
    registerStorage({
      id: "d64",
      name: name,
      description: description,
      export: async function (options) {
        await ensureSupport();
        if (!window.TPP || typeof window.TPP.exportImagesD64Core !== "function") {
          throw new Error("TPP.exportImagesD64Core not found.");
        }
        return window.TPP.exportImagesD64Core(options || {});
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
