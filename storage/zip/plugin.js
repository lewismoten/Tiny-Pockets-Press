(function () {
  const name = "ZIP Archive";
  const description = "Exports rendered page images into a ZIP archive.";
  const baseMessage = `Storage medium "${name}" could not register.`;
  const logError = function (message, err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      if (arguments.length > 1) console.error(message, err);
      else console.error(message);
    }
  };
  const registerStorage = window.TPP && window.TPP.registerStorage;
  if (typeof registerStorage !== "function") {
    logError(`${baseMessage} TPP.registerStorage not found.`);
    return;
  }
  try {
    registerStorage({
      id: "zip",
      name: name,
      description: description,
      export: async function (options) {
        if (!window.TPP || typeof window.TPP.exportImagesZipCore !== "function") {
          throw new Error("TPP.exportImagesZipCore not found.");
        }
        return window.TPP.exportImagesZipCore(options || {});
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
