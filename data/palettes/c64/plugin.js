(function () {
  const name = "Commodore 64";
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
                                        "id": "c64",
                                        "name": name,
                                        "description": "The standard 16-color Commodore 64 palette derived from the VIC-II graphics chip and widely used in C64 artwork and games.",
                                        "colorNumbers": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                                        "colorNames": [
                                          "black",
                                          "white",
                                          "red",
                                          "cyan",
                                          "purple",
                                          "green",
                                          "blue",
                                          "yellow",
                                          "orange",
                                          "brown",
                                          "light red",
                                          "dark gray",
                                          "medium gray",
                                          "light green",
                                          "light blue",
                                          "light gray"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#ffffff",
                                          "#813338",
                                          "#75cec8",
                                          "#8e3c97",
                                          "#56ac4d",
                                          "#2e2c9b",
                                          "#edf171",
                                          "#8e5029",
                                          "#553800",
                                          "#c46c71",
                                          "#4a4a4a",
                                          "#7b7b7b",
                                          "#a9ff9f",
                                          "#706deb",
                                          "#b2b2b2"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
