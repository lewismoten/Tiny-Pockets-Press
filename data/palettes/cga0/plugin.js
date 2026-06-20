(function () {
  const name = "CGA 0";
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
                                        "id": "cga0",
                                        "name": name,
                                        "description": "IBM CGA palette 0, the cyan-magenta-white set commonly seen in early composite and RGBI PC graphics.",
                                        "colorNumbers": [0, 1, 2, 3],
                                        "colorNames": [
                                          "black",
                                          "cyan",
                                          "magenta",
                                          "white"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#55ffff",
                                          "#ff55ff",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
