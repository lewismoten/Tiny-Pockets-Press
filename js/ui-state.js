window.TPP = window.TPP || {};
TPP.UI = TPP.UI || {};

TPP.initializeUiState = function () {
  if (TPP.uiStateInitialized) return;
  TPP.uiStateInitialized = true;

  const rangeValueTooltip = document.createElement("div");
  rangeValueTooltip.className = "range-value-tooltip";
  rangeValueTooltip.hidden = true;
  rangeValueTooltip.setAttribute("aria-hidden", "true");
  document.body.appendChild(rangeValueTooltip);

  let rangeHoverTooltipTimer = 0;

  TPP.rotationSnapSteps = [1, 5, 15, 45, 90];

  TPP.rangeValueUnit = function (input) {
    if (!input) return "";
    const explicit = String(input.dataset.rangeUnit || "").trim();
    if (explicit) return explicit;
    const id = String(input.id || "").trim();
    if (
      input.classList.contains("chapter-image-rotate") ||
      /(?:^|)(Rotate)$/.test(id) ||
      /ImgRotate$/.test(id)
    ) {
      return "°";
    }
    if (
      input.classList.contains("text-x") ||
      input.classList.contains("text-y") ||
      input.classList.contains("text-width") ||
      /(?:ImgX|ImgY|ImgZoom|Quality)$/.test(id)
    ) {
      return "%";
    }
    return "";
  };

  TPP.rangeValueText = function (input) {
    if (!input) return "";
    const numericValue = Number(input.value);
    const step = Number(input.step);
    const decimals =
      Number.isFinite(step) && step > 0 && !Number.isInteger(step)
        ? String(step).split(".")[1]?.length || 0
        : 0;
    const valueText = Number.isFinite(numericValue)
      ? numericValue
          .toFixed(decimals)
          .replace(/\.0+$/, "")
          .replace(/(\.\d*?)0+$/, "$1")
      : String(input.value || "");
    return valueText + TPP.rangeValueUnit(input);
  };

  TPP.positionRangeValueTooltip = function (input) {
    if (!input || !rangeValueTooltip) return;
    const text = TPP.rangeValueText(input);
    input.title = text;
    input.setAttribute("aria-valuetext", text);
    rangeValueTooltip.textContent = text;
    rangeValueTooltip.hidden = false;
    const rect = input.getBoundingClientRect();
    const tipRect = rangeValueTooltip.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - tipRect.width / 2;
    const top = rect.top + window.scrollY - tipRect.height - 8;
    rangeValueTooltip.style.left =
      Math.round(
        Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, left)),
      ) + "px";
    rangeValueTooltip.style.top = Math.round(Math.max(8, top)) + "px";
  };

  TPP.hideRangeValueTooltip = function () {
    if (!rangeValueTooltip) return;
    if (rangeHoverTooltipTimer) {
      window.clearTimeout(rangeHoverTooltipTimer);
      rangeHoverTooltipTimer = 0;
    }
    rangeValueTooltip.hidden = true;
  };

  TPP.scheduleRangeValueTooltip = function (input, delay) {
    if (!input || !TPP.positionRangeValueTooltip) return;
    if (rangeHoverTooltipTimer) window.clearTimeout(rangeHoverTooltipTimer);
    rangeHoverTooltipTimer = window.setTimeout(
      function () {
        rangeHoverTooltipTimer = 0;
        TPP.positionRangeValueTooltip(input);
      },
      Math.max(0, Number(delay) || 0),
    );
  };

  TPP.refreshRangeInputTitles = function (root) {
    (root || document)
      .querySelectorAll('input[type="range"]')
      .forEach(function (input) {
        const text = TPP.rangeValueText(input);
        input.title = text;
        input.setAttribute("aria-valuetext", text);
      });
  };

  TPP.rotationStepForInput = function (input) {
    const step = Number(input && input.step);
    return TPP.rotationSnapSteps.includes(step) ? step : 1;
  };

  TPP.rotationStepButtonInput = function (button) {
    if (!button) return null;
    const targetId = String(button.dataset.rotationStepCycle || "").trim();
    if (targetId) return document.getElementById(targetId);
    return button.parentElement?.querySelector('input[type="range"]') || null;
  };

  TPP.updateRotationStepButton = function (button, input) {
    if (!button || !input) return;
    const step = TPP.rotationStepForInput(input);
    const label = button.querySelector("span:last-child");
    if (label) label.textContent = step + "°";
    const title = "Rotation step " + step + " degrees";
    button.setAttribute("aria-label", title);
    button.setAttribute("title", title);
  };

  TPP.snapRotationInput = function (input) {
    if (!input) return;
    const step = TPP.rotationStepForInput(input);
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value) || 0;
    let snapped = Math.round(value / step) * step;
    if (Number.isFinite(min)) snapped = Math.max(min, snapped);
    if (Number.isFinite(max)) snapped = Math.min(max, snapped);
    input.value = String(snapped);
  };

  TPP.cycleRotationStep = function (button) {
    const input = TPP.rotationStepButtonInput(button);
    if (!input) return;
    const current = TPP.rotationStepForInput(input);
    const list = TPP.rotationSnapSteps;
    const next = list[(list.indexOf(current) + 1 + list.length) % list.length];
    input.step = String(next);
    TPP.snapRotationInput(input);
    TPP.updateRotationStepButton(button, input);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  TPP.refreshRotationStepButtons = function (root) {
    (root || document)
      .querySelectorAll(".rotation-step-cycle")
      .forEach(function (button) {
        const input = TPP.rotationStepButtonInput(button);
        if (input) TPP.updateRotationStepButton(button, input);
      });
  };
};

Object.assign(TPP.UI, {
  initialize: TPP.initializeUiState,
  rangeValueUnit: TPP.rangeValueUnit,
  rangeValueText: TPP.rangeValueText,
  positionRangeValueTooltip: TPP.positionRangeValueTooltip,
  hideRangeValueTooltip: TPP.hideRangeValueTooltip,
  scheduleRangeValueTooltip: TPP.scheduleRangeValueTooltip,
  refreshRangeInputTitles: TPP.refreshRangeInputTitles,
  rotationStepForInput: TPP.rotationStepForInput,
  rotationStepButtonInput: TPP.rotationStepButtonInput,
  updateRotationStepButton: TPP.updateRotationStepButton,
  snapRotationInput: TPP.snapRotationInput,
  cycleRotationStep: TPP.cycleRotationStep,
  refreshRotationStepButtons: TPP.refreshRotationStepButtons,
});
