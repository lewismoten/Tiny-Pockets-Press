let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;
  const popover = document.getElementById("colorPickerPopover");
  const colorPickerHex = document.getElementById("colorPickerHex");
  const colorPickerSurface = document.getElementById("colorPickerSurface");
  const colorPickerHue = document.getElementById("colorPickerHue");
  if (colorPickerHex) {
    colorPickerHex.addEventListener("input", function () {
      const value = TPP.normalizeHexColor(colorPickerHex.value);
      if (value) TPP.updateColorDialogPreview(value);
    });
  }
  const bindColorPointerField = function (element, onUpdate) {
    if (!element) return;
    let dragging = false;
    const update = function (event) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      onUpdate(TPP.clamp01(x), TPP.clamp01(y));
    };
    element.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (element.setPointerCapture) element.setPointerCapture(event.pointerId);
      update(event);
      event.preventDefault();
    });
    element.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      update(event);
      event.preventDefault();
    });
    element.addEventListener("pointerup", function (event) {
      dragging = false;
      if (
        element.hasPointerCapture &&
        element.hasPointerCapture(event.pointerId)
      ) {
        element.releasePointerCapture(event.pointerId);
      }
    });
    element.addEventListener("pointercancel", function (event) {
      dragging = false;
      if (
        element.hasPointerCapture &&
        element.hasPointerCapture(event.pointerId)
      ) {
        element.releasePointerCapture(event.pointerId);
      }
    });
  };
  bindColorPointerField(colorPickerSurface, function (x, y) {
    TPP.colorPickerState.s = x;
    TPP.colorPickerState.v = 1 - y;
    TPP.updateColorDialogPreview(TPP.colorFromPickerState());
  });
  bindColorPointerField(colorPickerHue, function (x) {
    TPP.colorPickerState.h = x * 360;
    TPP.updateColorDialogPreview(TPP.colorFromPickerState());
  });
  if (popover) {
    popover.addEventListener("click", function (e) {
      const swatch = e.target.closest("[data-dialog-color]");
      if (swatch) {
        TPP.updateColorDialogPreview(swatch.dataset.dialogColor || "#000000");
      }
    });
  }
  document.addEventListener("keydown", function (event) {
    const pop = document.getElementById("colorPickerPopover");
    if (!pop || pop.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      TPP.closeColorDialog();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const hex = document.getElementById("colorPickerHex");
      const value = TPP.normalizeHexColor(hex && hex.value);
      if (value) TPP.updateColorDialogPreview(value);
      TPP.closeColorDialog();
    }
  });
  document.addEventListener("mousedown", function (e) {
    const pop = document.getElementById("colorPickerPopover");
    if (!pop || pop.hidden) return;
    const trigger = e.target.closest(
      ".color-picker-trigger, .front-cover-text-outline-hit",
    );
    if (trigger) return;
    if (!e.target.closest("#colorPickerPopover")) TPP.closeColorDialog();
  });
  window.addEventListener("resize", TPP.positionColorPopover);
  window.addEventListener("scroll", TPP.positionColorPopover, true);
  return {};
}
