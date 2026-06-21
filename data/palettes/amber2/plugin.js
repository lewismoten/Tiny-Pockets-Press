(function () {
  const name = "Amber Phosphor";
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
      schemaVersion: 1,
      id: "amber2",
      name: name,
      description:
        "A simple 2-color amber-phosphor monitor palette inspired by monochrome CRT displays used on early terminals and word processors.",
      colorNumbers: [0, 1],
      colorNames: ["black", "amber phosphor"],
      colors: ["#000000", "#ffbf00"],
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
