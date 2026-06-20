(function () {
  const name = "32 Grayscale";
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
                                        "id": "gray32",
                                        "name": name,
                                        "colors": [
                                          "#000000",
                                          "#080808",
                                          "#101010",
                                          "#191919",
                                          "#212121",
                                          "#292929",
                                          "#313131",
                                          "#3a3a3a",
                                          "#424242",
                                          "#4a4a4a",
                                          "#525252",
                                          "#5a5a5a",
                                          "#636363",
                                          "#6b6b6b",
                                          "#737373",
                                          "#7b7b7b",
                                          "#848484",
                                          "#8c8c8c",
                                          "#949494",
                                          "#9c9c9c",
                                          "#a5a5a5",
                                          "#adadad",
                                          "#b5b5b5",
                                          "#bdbdbd",
                                          "#c5c5c5",
                                          "#cecece",
                                          "#d6d6d6",
                                          "#dedede",
                                          "#e6e6e6",
                                          "#efefef",
                                          "#f7f7f7",
                                          "#ffffff"
                                        ]
                                      });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
