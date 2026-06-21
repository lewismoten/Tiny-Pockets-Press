(function () {
  const name = "Commodore 64 D64";
  const description =
    "Exports rendered page graphics and assets into Commodore 64 disk images.";
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
      id: "d64",
      name: name,
      description: description,
      export: async function (options) {
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
