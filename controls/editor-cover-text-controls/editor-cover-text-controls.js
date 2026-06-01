let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const syncTextGroup = function (event, mode) {
    const textElementEntry = event.target.closest(".text-element-group");
    if (!textElementEntry || !TPP.readSingleTextElementGroup) return false;
    const textLocation = String(textElementEntry.dataset.location || "").trim();
    const renderAction = TPP.editorRenderActionForTarget(event.target);

    if (
      (event.target.classList.contains("text-color") ||
        event.target.classList.contains("text-outline-color")) &&
      TPP.syncTextOutlineColorControl
    ) {
      TPP.syncTextOutlineColorControl(event.target);
    }

    TPP.readSingleTextElementGroup(TPP.active, textElementEntry);
    if (TPP.syncLegacyTextFieldsFromElements) {
      TPP.syncLegacyTextFieldsFromElements(TPP.active);
    }

    if (mode === "draft") {
      if (TPP.scheduleDraftSave) {
        TPP.scheduleDraftSave(TPP.bookId(TPP.active), 180);
      } else {
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.scheduleRevisionCommit(TPP.bookId(TPP.active));
      }
      if (event.target.classList.contains("text-field-key")) {
        TPP.renderTextElementControls();
      }
      if (TPP.patchVisibleCoverTextPreview(textLocation)) {
        if (TPP.renderColorPalettes) TPP.renderColorPalettes();
        return true;
      }
      TPP.scheduleEditorRender(renderAction, { debounce: true, delay: 64 });
      return true;
    }

    TPP.save("commit", TPP.bookId(TPP.active));
    if (event.target.classList.contains("text-field-key")) {
      TPP.renderTextElementControls();
    }
    if (TPP.patchVisibleCoverTextPreview(textLocation)) {
      if (TPP.renderColorPalettes) TPP.renderColorPalettes();
      return true;
    }
    TPP.scheduleEditorRender(renderAction);
    return true;
  };

  return {
    handleInput(event) {
      return syncTextGroup(event, "draft");
    },
    handleChange(event) {
      return syncTextGroup(event, "commit");
    },
    handleClick(event, controls) {
      const colorTrigger = event.target.closest(".color-picker-trigger");
      if (colorTrigger) {
        event.preventDefault();
        event.stopPropagation();
        const input = controls.querySelector(
          '[data-color-input-id="' + colorTrigger.dataset.colorTarget + '"]',
        );
        if (input) TPP.openColorDialog(input);
        return true;
      }

      const colorSwatchTrigger = event.target.closest(
        "[data-color-swatch-target]",
      );
      if (colorSwatchTrigger) {
        event.preventDefault();
        event.stopPropagation();
        const input = controls.querySelector(
          '[data-color-input-id="' +
            colorSwatchTrigger.dataset.colorSwatchTarget +
            '"]',
        );
        if (input) TPP.openColorDialog(input, colorSwatchTrigger);
        return true;
      }

      const alignCycle = event.target.closest("[data-text-align-cycle]");
      if (alignCycle) {
        event.preventDefault();
        const hiddenInput = alignCycle
          .closest(".text-element-group")
          ?.querySelector(".text-align");
        if (!hiddenInput || !TPP.nextTextAlignMode || !TPP.textAlignMeta) {
          return true;
        }
        const nextMode = TPP.nextTextAlignMode(hiddenInput.value || "");
        const meta = TPP.textAlignMeta(nextMode);
        hiddenInput.value = nextMode;
        alignCycle.dataset.textAlignCycle = nextMode;
        alignCycle.setAttribute("aria-label", meta.label);
        alignCycle.setAttribute("title", meta.label);
        const image = alignCycle.querySelector("img");
        if (image) image.setAttribute("src", meta.icon);
        TPP.sync("commit");
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      const customTextEdit = event.target.closest("[data-custom-text-edit]");
      if (customTextEdit) {
        event.preventDefault();
        const group = customTextEdit.closest(".text-element-group");
        if (group && TPP.openCustomTextDialog) TPP.openCustomTextDialog(group);
        return true;
      }

      const textButton = event.target.closest("[data-text-action]");
      if (textButton) {
        const action = textButton.dataset.textAction;
        const group = textButton.closest(".text-element-group");
        if (action === "add") {
          TPP.sync("nosave");
          TPP.openFrontCoverFieldDialog(textButton.dataset.location || "front");
          return true;
        }
        TPP.sync("nosave");
        if (action === "remove" && group) {
          TPP.removeTextElement(TPP.active, group.dataset.textId);
        }
        TPP.save();
        TPP.renderAll();
        return true;
      }

      const openFieldPicker = event.target.closest(
        "#openFrontCoverFieldPicker",
      );
      if (openFieldPicker) {
        TPP.sync("nosave");
        TPP.openFrontCoverFieldDialog();
        return true;
      }

      return false;
    },
    handleMouseDown(event) {
      const colorTrigger = event.target.closest(".color-picker-trigger");
      if (!colorTrigger) return false;
      event.preventDefault();
      event.stopPropagation();
      return true;
    },
  };
}
