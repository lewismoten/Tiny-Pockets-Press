(function () {
  const name = "32 Colors";
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
                                        "id": "colors32",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#000080",
                                          "#0000ff",
                                          "#008000",
                                          "#008080",
                                          "#0080ff",
                                          "#00ff00",
                                          "#00ff80",
                                          "#00ffff",
                                          "#800000",
                                          "#800080",
                                          "#8000ff",
                                          "#808000",
                                          "#808080",
                                          "#8080ff",
                                          "#80ff00",
                                          "#80ff80",
                                          "#80ffff",
                                          "#ff0000",
                                          "#ff0080",
                                          "#ff00ff",
                                          "#ff8000",
                                          "#ff8080",
                                          "#ff80ff",
                                          "#ffff00",
                                          "#ffff80",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
