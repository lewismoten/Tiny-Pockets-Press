(function () {
  const name = "16 Grayscale";
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
                                        "id": "gray16",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#111111",
                                          "#222222",
                                          "#333333",
                                          "#444444",
                                          "#555555",
                                          "#666666",
                                          "#777777",
                                          "#888888",
                                          "#999999",
                                          "#aaaaaa",
                                          "#bbbbbb",
                                          "#cccccc",
                                          "#dddddd",
                                          "#eeeeee",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
