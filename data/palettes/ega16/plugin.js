(function () {
  const name = "EGA";
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
                                        "id": "ega16",
                                        "name": name,
                                        "description": "IBM Enhanced Graphics Adapter 16-color palette, common in late DOS software before VGA became dominant.",
                                        "colorNumbers": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                                        "colorNames": [
                                          "black",
                                          "blue",
                                          "green",
                                          "cyan",
                                          "red",
                                          "magenta",
                                          "brown",
                                          "light gray",
                                          "dark gray",
                                          "bright blue",
                                          "bright green",
                                          "bright cyan",
                                          "bright red",
                                          "bright magenta",
                                          "yellow",
                                          "white"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#0000aa",
                                          "#00aa00",
                                          "#00aaaa",
                                          "#aa0000",
                                          "#aa00aa",
                                          "#aa5500",
                                          "#aaaaaa",
                                          "#555555",
                                          "#5555ff",
                                          "#55ff55",
                                          "#55ffff",
                                          "#ff5555",
                                          "#ff55ff",
                                          "#ffff55",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
