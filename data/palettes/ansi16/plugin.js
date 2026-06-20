(function () {
  const name = "ANSI 16";
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
                                        "id": "ansi16",
                                        "name": name,
                                        "description": "The traditional 16-color ANSI terminal palette, combining 8 base colors with their bright counterparts.",
                                        "colorNumbers": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                                        "colorNames": [
                                          "black",
                                          "red",
                                          "green",
                                          "yellow",
                                          "blue",
                                          "magenta",
                                          "cyan",
                                          "white",
                                          "bright black",
                                          "bright red",
                                          "bright green",
                                          "bright yellow",
                                          "bright blue",
                                          "bright magenta",
                                          "bright cyan",
                                          "bright white"
                                        ],
                                        "colors": [
                                          "#000000",
                                          "#cd0000",
                                          "#00cd00",
                                          "#cdcd00",
                                          "#0000ee",
                                          "#cd00cd",
                                          "#00cdcd",
                                          "#e5e5e5",
                                          "#7f7f7f",
                                          "#ff0000",
                                          "#00ff00",
                                          "#ffff00",
                                          "#5c5cff",
                                          "#ff00ff",
                                          "#00ffff",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
