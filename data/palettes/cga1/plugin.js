(function () {
  const name = "CGA 1";
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
                                        "id": "cga1",
                                        "name": name,
                                        "description": "IBM CGA palette 1, the green-red-brown set used by many early DOS games and applications.",
                                        "colorNumbers": [0, 1, 2, 3],
                                        "colorNames": [
                                          "black",
                                          "green",
                                          "red",
                                          "brown"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#55ff55",
                                          "#ff5555",
                                          "#aa5500"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
