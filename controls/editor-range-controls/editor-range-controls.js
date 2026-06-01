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
      if (!isRange(event.target) || !TPP.positionRangeValueTooltip)
        return false;
      TPP.positionRangeValueTooltip(event.target);
      return true;
    },
    handleChange(event) {
      if (!isRange(event.target) || !TPP.positionRangeValueTooltip)
        return false;
      TPP.positionRangeValueTooltip(event.target);
      return true;
    },
    handleFocusIn(event) {
      if (!isRange(event.target) || !TPP.positionRangeValueTooltip)
        return false;
      TPP.positionRangeValueTooltip(event.target);
      return true;
    },
    handlePointerDown(event) {
      if (!isRange(event.target) || !TPP.positionRangeValueTooltip)
        return false;
      if (TPP.hideRangeValueTooltip) TPP.hideRangeValueTooltip();
      TPP.positionRangeValueTooltip(event.target);
      return true;
    },
    handlePointerOver(event) {
      if (!isRange(event.target) || !TPP.scheduleRangeValueTooltip)
        return false;
      TPP.scheduleRangeValueTooltip(event.target, 420);
      return true;
    },
    handlePointerOut(event) {
      if (!isRange(event.target) || !TPP.hideRangeValueTooltip) return false;
      TPP.hideRangeValueTooltip();
      return true;
    },
    handleFocusOut(event) {
      if (!isRange(event.target) || !TPP.hideRangeValueTooltip) return false;
      TPP.hideRangeValueTooltip();
      return true;
    },
    handlePointerUp(event) {
      if (!isRange(event.target) || !TPP.hideRangeValueTooltip) return false;
      window.setTimeout(TPP.hideRangeValueTooltip, 250);
      return true;
    },
    handleClick(event) {
      const button = event.target.closest(".rotation-step-cycle");
      if (!button || !TPP.cycleRotationStep) return false;
      event.preventDefault();
      TPP.cycleRotationStep(button);
      return true;
    },
  };
}
