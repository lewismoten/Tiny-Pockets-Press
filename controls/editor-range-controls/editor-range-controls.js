let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const isRange = function (target) {
    return !!(
      target &&
      target.matches &&
      target.matches('input[type="range"]')
    );
  };

  return {
    handleInput(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.positionRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.positionRangeValueTooltip(event.target);
      return true;
    },
    handleChange(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.positionRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.positionRangeValueTooltip(event.target);
      return true;
    },
    handleFocusIn(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.positionRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.positionRangeValueTooltip(event.target);
      return true;
    },
    handlePointerDown(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.positionRangeValueTooltip !== "function"
      )
        return false;
      if (typeof TPP.UI.hideRangeValueTooltip === "function") {
        TPP.UI.hideRangeValueTooltip();
      }
      TPP.UI.positionRangeValueTooltip(event.target);
      return true;
    },
    handlePointerOver(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.scheduleRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.scheduleRangeValueTooltip(event.target, 420);
      return true;
    },
    handlePointerOut(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.hideRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.hideRangeValueTooltip();
      return true;
    },
    handleFocusOut(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.hideRangeValueTooltip !== "function"
      )
        return false;
      TPP.UI.hideRangeValueTooltip();
      return true;
    },
    handlePointerUp(event) {
      if (
        !isRange(event.target) ||
        !TPP.UI ||
        typeof TPP.UI.hideRangeValueTooltip !== "function"
      )
        return false;
      window.setTimeout(TPP.UI.hideRangeValueTooltip, 250);
      return true;
    },
    handleClick(event) {
      const button = event.target.closest(".rotation-step-cycle");
      if (!button || !TPP.UI || typeof TPP.UI.cycleRotationStep !== "function")
        return false;
      event.preventDefault();
      TPP.UI.cycleRotationStep(button);
      return true;
    },
  };
}
