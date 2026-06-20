(function () {
  const name = "Windows 16";
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
                                        "id": "windows16",
                                        "name": name,
                                        "description": "The standard 16-color Windows system palette used by legacy VGA-era software and desktop themes.",
                                        "colorNumbers": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                                        "colorNames": [
                                          "black",
                                          "maroon",
                                          "green",
                                          "olive",
                                          "navy",
                                          "purple",
                                          "teal",
                                          "silver",
                                          "gray",
                                          "red",
                                          "lime",
                                          "yellow",
                                          "blue",
                                          "fuchsia",
                                          "aqua",
                                          "white"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#800000",
                                          "#008000",
                                          "#808000",
                                          "#000080",
                                          "#800080",
                                          "#008080",
                                          "#c0c0c0",
                                          "#808080",
                                          "#ff0000",
                                          "#00ff00",
                                          "#ffff00",
                                          "#0000ff",
                                          "#ff00ff",
                                          "#00ffff",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
