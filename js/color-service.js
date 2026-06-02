window.TPP = window.TPP || {};

TPP.normalizeHexColor = function (value) {
  const text = String(value || "").trim();
  const match = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return "";
  const hex = match[1].toLowerCase();
  if (hex.length === 3) {
    return (
      "#" +
      hex
        .split("")
        .map(function (part) {
          return part + part;
        })
        .join("")
    );
  }
  return "#" + hex;
};
TPP.collectUsedColors = function (book) {
  const found = [];
  const seenColors = new Set();
  const seenObjects = new Set();
  const pushColor = function (value) {
    const normalized = TPP.normalizeHexColor(value);
    if (!normalized || seenColors.has(normalized)) return;
    seenColors.add(normalized);
    found.push(normalized);
  };
  const visit = function (value) {
    if (!value) return;
    if (typeof value === "string") {
      pushColor(value);
      return;
    }
    if (typeof value !== "object") return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    Object.keys(value).forEach(function (key) {
      visit(value[key]);
    });
  };
  visit(book);
  document
    .querySelectorAll('.controls input[type="color"]')
    .forEach(function (input) {
      pushColor(input.value);
    });
  return TPP.sortColorsByHsv(found);
};
TPP.colorPaletteAnchor = function (input) {
  if (!input) return null;
  if (
    input.parentElement &&
    input.parentElement.classList.contains("color-picker-shell")
  )
    return input.parentElement;
  const wrapper = document.createElement("span");
  wrapper.className = "color-picker-shell";
  input.insertAdjacentElement("beforebegin", wrapper);
  wrapper.appendChild(input);
  return wrapper;
};
TPP.renderColorPickerTriggers = function () {
  const controlsRoot = document.querySelector(".controls");
  if (!controlsRoot) return;
  controlsRoot
    .querySelectorAll('input[type="color"]')
    .forEach(function (input) {
      if (input.classList.contains("text-swatch-input")) return;
      const anchor = TPP.colorPaletteAnchor(input);
      if (!anchor) return;
      input.classList.add("color-input-native");
      input.tabIndex = -1;
      if (!input.dataset.colorInputId)
        input.dataset.colorInputId = "color-input-" + TPP.uid();
      let trigger = anchor.querySelector(".color-picker-trigger");
      if (!trigger) {
        trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "color-picker-trigger";
        anchor.appendChild(trigger);
      }
      trigger.dataset.colorTarget = input.dataset.colorInputId;
      trigger.setAttribute(
        "aria-label",
        (input.getAttribute("aria-label") || "Choose color") +
          " " +
          (TPP.normalizeHexColor(input.value) || ""),
      );
      trigger.title = TPP.normalizeHexColor(input.value) || "Choose color";
      trigger.style.setProperty(
        "--picker-color",
        TPP.normalizeHexColor(input.value) || "#000000",
      );
    });
};
TPP.renderColorPalettes = function () {
  TPP.renderColorPickerTriggers();
};
TPP.colorDialogValue = "#000000";
TPP.colorDialogTargetId = "";
TPP.colorDialogAnchorId = "";
TPP.colorPickerState = { h: 0, s: 0, v: 0 };
TPP.clamp01 = function (value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
};
TPP.clampHue = function (value) {
  const raw = Number(value) || 0;
  return ((raw % 360) + 360) % 360;
};
TPP.hsvToRgb = function (h, s, v) {
  const hue = TPP.clampHue(h);
  const sat = TPP.clamp01(s);
  const val = TPP.clamp01(v);
  const c = val * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};
TPP.rgbToHex = function (rgb) {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map(function (value) {
        return Math.max(0, Math.min(255, Number(value) || 0))
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
};
TPP.hexToHsv = function (hex) {
  const normalized = TPP.normalizeHexColor(hex) || "#000000";
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : delta / max;
  return { h: h, s: s, v: max };
};
TPP.sortColorsByHsv = function (colors) {
  return (Array.isArray(colors) ? colors.slice() : []).sort(function (a, b) {
    const left = TPP.hexToHsv(a);
    const right = TPP.hexToHsv(b);
    const hueDiff = left.h - right.h;
    if (Math.abs(hueDiff) > 0.0001) return hueDiff;
    const satDiff = left.s - right.s;
    if (Math.abs(satDiff) > 0.0001) return satDiff;
    const valueDiff = left.v - right.v;
    if (Math.abs(valueDiff) > 0.0001) return valueDiff;
    return String(a).localeCompare(String(b));
  });
};
TPP.colorFromPickerState = function () {
  return TPP.rgbToHex(
    TPP.hsvToRgb(
      TPP.colorPickerState.h,
      TPP.colorPickerState.s,
      TPP.colorPickerState.v,
    ),
  );
};
TPP.renderColorDialogSwatches = function (colors, selected, container) {
  if (!container) return;
  container.innerHTML = colors.length
    ? colors
        .map(function (color) {
          return (
            '<button type="button" class="color-dialog-swatch' +
            (color === selected ? " is-active" : "") +
            '" data-dialog-color="' +
            color +
            '" title="' +
            color +
            '" aria-label="Use color ' +
            color +
            '" style="--swatch:' +
            color +
            '"></button>'
          );
        })
        .join("")
    : '<div class="color-dialog-empty">No colors used yet.</div>';
};
TPP.positionColorPopover = function () {
  const popover = document.getElementById("colorPickerPopover");
  const anchor =
    document.querySelector(
      '[data-color-anchor-id="' + TPP.colorDialogAnchorId + '"]',
    ) ||
    document.querySelector(
      '[data-color-input-id="' + TPP.colorDialogAnchorId + '"]',
    );
  if (!popover || !anchor) return;
  const trigger =
    anchor.classList.contains("color-picker-trigger") ||
    anchor.classList.contains("front-cover-text-outline-hit")
      ? anchor
      : anchor.parentElement &&
        anchor.parentElement.querySelector(".color-picker-trigger");
  const rect = (trigger || anchor).getBoundingClientRect();
  popover.hidden = false;
  const popRect = popover.getBoundingClientRect();
  const width = popRect.width || 320;
  const height = popRect.height || 420;
  const gap = 8;
  let left = rect.left;
  let top = rect.bottom + gap;
  if (left + width > window.innerWidth - 12)
    left = Math.max(12, window.innerWidth - width - 12);
  if (top + height > window.innerHeight - 12)
    top = Math.max(12, rect.top - height - gap);
  popover.style.left = Math.round(left) + "px";
  popover.style.top = Math.round(top) + "px";
};
TPP.updateColorDialogPreview = function (value, skipApply) {
  const color = TPP.normalizeHexColor(value) || TPP.colorDialogValue;
  const preview = document.getElementById("colorPickerPreview");
  const hex = document.getElementById("colorPickerHex");
  const surface = document.getElementById("colorPickerSurface");
  const surfaceMarker = document.getElementById("colorPickerSurfaceMarker");
  const hue = document.getElementById("colorPickerHue");
  const hueMarker = document.getElementById("colorPickerHueMarker");
  TPP.colorPickerState = TPP.hexToHsv(color);
  if (preview) preview.style.setProperty("--picker-color", color);
  if (hex && document.activeElement !== hex) hex.value = color;
  if (surface) {
    surface.style.setProperty(
      "--picker-hue",
      "hsl(" + Math.round(TPP.colorPickerState.h) + " 100% 50%)",
    );
  }
  if (surfaceMarker) {
    surfaceMarker.style.left = TPP.colorPickerState.s * 100 + "%";
    surfaceMarker.style.top = (1 - TPP.colorPickerState.v) * 100 + "%";
  }
  if (hueMarker) {
    hueMarker.style.left = (TPP.colorPickerState.h / 360) * 100 + "%";
  }
  if (hue) {
    hue.style.setProperty(
      "--picker-hue",
      "hsl(" + Math.round(TPP.colorPickerState.h) + " 100% 50%)",
    );
  }
  TPP.colorDialogValue = color;
  TPP.renderColorDialogSwatches(
    TPP.collectUsedColors(TPP.active),
    color,
    document.getElementById("colorPickerUsedColors"),
  );
  if (!skipApply) TPP.applyColorDialogValue();
};
TPP.applyColorDialogValue = function () {
  const target = document.querySelector(
    '[data-color-input-id="' + TPP.colorDialogTargetId + '"]',
  );
  if (!target) return;
  target.value = TPP.colorDialogValue;
  if (TPP.syncTextOutlineColorControl) {
    TPP.syncTextOutlineColorControl(target);
  }
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
};
TPP.closeColorDialog = function () {
  const popover = document.getElementById("colorPickerPopover");
  if (!popover) return;
  popover.hidden = true;
  TPP.colorDialogAnchorId = "";
};
TPP.openColorDialog = async function (input, anchor) {
  if (typeof TPP.ensureControlModule === "function") {
    await TPP.ensureControlModule("color-picker-popover");
  }
  const popover = document.getElementById("colorPickerPopover");
  if (!popover || !input) return;
  if (!input.dataset.colorInputId)
    input.dataset.colorInputId = "color-input-" + TPP.uid();
  TPP.colorDialogTargetId = input.dataset.colorInputId;
  if (anchor) {
    if (!anchor.dataset.colorAnchorId)
      anchor.dataset.colorAnchorId = "color-anchor-" + TPP.uid();
    TPP.colorDialogAnchorId = anchor.dataset.colorAnchorId;
  } else {
    TPP.colorDialogAnchorId = input.dataset.colorInputId;
  }
  TPP.colorDialogValue = TPP.normalizeHexColor(input.value) || "#000000";
  popover.hidden = false;
  TPP.updateColorDialogPreview(TPP.colorDialogValue, true);
  TPP.positionColorPopover();
};
TPP.syncTextOutlineColorControl = function (input) {
  if (!input) return;
  const wrapper = input.closest(".front-cover-text-outline-cell");
  if (!wrapper) return;
  const fillInput = wrapper.querySelector(".text-color");
  const outlineInput = wrapper.querySelector(".text-outline-color");
  const fillColor = TPP.normalizeHexColor(fillInput && fillInput.value);
  const outlineColor = TPP.normalizeHexColor(
    outlineInput && outlineInput.value,
  );
  if (fillColor) wrapper.style.setProperty("--text-fill-color", fillColor);
  if (outlineColor)
    wrapper.style.setProperty("--text-outline-color", outlineColor);
  const fillButton = wrapper.querySelector(
    ".front-cover-text-outline-hit-fill",
  );
  const outlineButton = wrapper.querySelector(
    ".front-cover-text-outline-hit-outline",
  );
  if (fillButton && fillColor) fillButton.setAttribute("title", fillColor);
  if (outlineButton && outlineColor)
    outlineButton.setAttribute("title", outlineColor);
};
