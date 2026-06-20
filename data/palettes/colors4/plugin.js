(function () {
  const name = "4 Colors";
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
                                        "id": "colors4",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#00ff00",
                                          "#ff0000",
                                          "#ffff00"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
