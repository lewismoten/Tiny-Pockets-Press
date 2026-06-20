(function () {
  const name = "8 Colors";
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
                                        "id": "colors8",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#0000ff",
                                          "#00ff00",
                                          "#00ffff",
                                          "#ff0000",
                                          "#ff00ff",
                                          "#ffff00",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
