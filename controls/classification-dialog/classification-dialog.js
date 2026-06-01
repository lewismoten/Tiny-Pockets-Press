let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;
  const classificationDialog = document.getElementById("classificationDialog");
  if (classificationDialog) {
    classificationDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (
        e.target === classificationDialog &&
        !card &&
        classificationDialog.open
      ) {
        classificationDialog.close("cancel");
        return;
      }
      const closeButton = e.target.closest(
        "[data-action='cancel-classification']",
      );
      if (closeButton && classificationDialog.open) {
        classificationDialog.close("cancel");
        return;
      }
      const crumb = e.target.closest("[data-classification-crumb]");
      if (crumb) {
        const raw = crumb.dataset.classificationCrumb || "";
        TPP.classificationDialogPath = raw ? JSON.parse(raw) : [];
        TPP.classificationDialogExtensionPath = [];
        const crumbNode = TPP.classificationNodeAtPath(
          TPP.classificationDialogPath,
        );
        TPP.setClassificationDialogCode(
          (crumbNode && crumbNode.code) || "",
          "",
        );
        TPP.renderClassificationDialog();
        return;
      }
      const extensionCrumb = e.target.closest(
        "[data-classification-extension-crumb]",
      );
      if (extensionCrumb) {
        const raw = extensionCrumb.dataset.classificationExtensionCrumb || "";
        TPP.classificationDialogExtensionPath = raw ? JSON.parse(raw) : [];
        const selectedNode = TPP.classificationNodeAtPath(
          TPP.classificationDialogPath,
        );
        const extensionNode =
          selectedNode && selectedNode.code
            ? TPP.classificationExtensionNodeAtPath(
                selectedNode.code,
                TPP.classificationDialogExtensionPath,
              )
            : null;
        TPP.setClassificationDialogCode(
          (selectedNode && selectedNode.code) || "",
          (extensionNode && extensionNode.extension) || "",
        );
        TPP.renderClassificationDialog();
        return;
      }
      const openButton = e.target.closest("[data-classification-open]");
      if (openButton) {
        TPP.classificationDialogPath = JSON.parse(
          openButton.dataset.classificationOpen || "[]",
        );
        const selectedNode = TPP.classificationNodeAtPath(
          TPP.classificationDialogPath,
        );
        TPP.setClassificationDialogCode(
          (selectedNode && selectedNode.code) || "",
          TPP.classificationDialogSelection.extension || "",
        );
        TPP.renderClassificationDialog();
        return;
      }
      const extensionOpenButton = e.target.closest(
        "[data-classification-extension-open]",
      );
      if (extensionOpenButton) {
        TPP.classificationDialogExtensionPath = JSON.parse(
          extensionOpenButton.dataset.classificationExtensionOpen || "[]",
        );
        const selectedNode = TPP.classificationNodeAtPath(
          TPP.classificationDialogPath,
        );
        const extensionNode =
          selectedNode && selectedNode.code
            ? TPP.classificationExtensionNodeAtPath(
                selectedNode.code,
                TPP.classificationDialogExtensionPath,
              )
            : null;
        TPP.setClassificationDialogCode(
          (selectedNode && selectedNode.code) || "",
          (extensionNode && extensionNode.extension) || "",
        );
        TPP.renderClassificationDialog();
        return;
      }
      const relatedButton = e.target.closest("[data-classification-related]");
      if (relatedButton) {
        TPP.applyClassificationSearchSelection(
          JSON.parse(relatedButton.dataset.classificationRelated || "{}"),
        );
        return;
      }
      const selectButton = e.target.closest("[data-classification-select]");
      if (selectButton) {
        TPP.applyClassificationValue();
        if (classificationDialog.open) classificationDialog.close("selected");
        return;
      }
      const clearButton = e.target.closest("[data-classification-clear]");
      if (clearButton) {
        const row = document.querySelector(
          '.book-info-entry[data-entry-id="' +
            TPP.classificationDialogTargetEntryId +
            '"]',
        );
        const input = row && row.querySelector(".book-info-value");
        if (input) input.value = "";
        TPP.classificationDialogSelection.code = "";
        TPP.classificationDialogSelection.extension = "";
        TPP.classificationDialogExtensionPath = [];
        TPP.sync("commit");
        TPP.loadForm();
        TPP.renderAll();
        if (classificationDialog.open) classificationDialog.close("cleared");
      }
    });
  }
  document.addEventListener("input", function (e) {
    const profileSelect = e.target.closest("#classificationDialogProfile");
    if (profileSelect) {
      TPP.setClassificationProfile(profileSelect.value || "home");
      TPP.renderClassificationDialog();
      return;
    }
    const searchInput = e.target.closest("#classificationDialogSearch");
    if (!searchInput) return;
    TPP.classificationDialogSearchQuery = searchInput.value || "";
    const results = TPP.searchClassificationIndex(
      TPP.classificationDialogSearchQuery,
      8,
    );
    TPP.classificationDialogSearchActiveIndex = results.length ? 0 : -1;
    TPP.renderClassificationSearchResults(results, 0);
  });
  document.addEventListener("focusin", function (e) {
    const searchInput = e.target.closest("#classificationDialogSearch");
    if (!searchInput) return;
    const results = TPP.searchClassificationIndex(searchInput.value, 8);
    if (!results.length) return;
    TPP.classificationDialogSearchActiveIndex = 0;
    TPP.renderClassificationSearchResults(results, 0);
  });
  document.addEventListener("click", function (e) {
    const searchInput = e.target.closest("#classificationDialogSearch");
    if (searchInput) {
      const results = TPP.searchClassificationIndex(searchInput.value, 8);
      if (results.length) {
        const activeIndex = Number(TPP.classificationDialogSearchActiveIndex);
        TPP.renderClassificationSearchResults(
          results,
          activeIndex >= 0 ? activeIndex : 0,
        );
      }
      return;
    }
    const result = e.target.closest("[data-classification-search-select]");
    if (result) {
      TPP.applyClassificationSearchSelection(
        JSON.parse(result.dataset.classificationSearchSelect || "{}"),
      );
      return;
    }
    if (!e.target.closest(".classification-search-wrap")) {
      TPP.closeClassificationSearchResults();
    }
  });
  document.addEventListener("keydown", function (e) {
    const searchInput = e.target.closest("#classificationDialogSearch");
    if (!searchInput) return;
    const results = TPP.searchClassificationIndex(searchInput.value, 8);
    if (!results.length) {
      if (e.key === "Escape") TPP.closeClassificationSearchResults();
      return;
    }
    const currentIndex = Number(TPP.classificationDialogSearchActiveIndex || 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, results.length - 1);
      TPP.classificationDialogSearchActiveIndex = nextIndex;
      TPP.renderClassificationSearchResults(results, nextIndex);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIndex = Math.max(currentIndex - 1, 0);
      TPP.classificationDialogSearchActiveIndex = nextIndex;
      TPP.renderClassificationSearchResults(results, nextIndex);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex = Math.min(Math.max(currentIndex, 0), results.length - 1);
      TPP.applyClassificationSearchSelection(results[nextIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      TPP.closeClassificationSearchResults();
    }
  });
  document.addEventListener("focusout", function (e) {
    const wrap = e.target.closest(".classification-search-wrap");
    if (!wrap) return;
    window.setTimeout(function () {
      if (!wrap.contains(document.activeElement)) {
        TPP.closeClassificationSearchResults();
      }
    }, 0);
  });
  return {};
}
