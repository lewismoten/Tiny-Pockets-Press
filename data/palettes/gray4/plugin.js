(function () {
  const name = "4 Grayscale";
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
                                        "schemaVersion": 1,
                                        "id": "gray4",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#555555",
                                          "#aaaaaa",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
