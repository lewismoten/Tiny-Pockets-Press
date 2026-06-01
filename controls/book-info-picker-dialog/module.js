let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openBookInfoPickerDialog };
  initialized = true;
  TPP.renderBookInfoPickerResults = function (results, activeIndex) {
    const list = document.getElementById("bookInfoPickerResults");
    if (!list) return;
    if (!results.length) {
      list.hidden = true;
      list.innerHTML = "";
      return;
    }
    list.hidden = false;
    list.innerHTML = results
      .map(function (entry, index) {
        return (
          '<button type="button" class="classification-dialog-search-result' +
          (index === activeIndex ? " is-active" : "") +
          '" data-book-info-picker-select="' +
          TPP.esc(entry.value) +
          '">' +
          '<span class="classification-dialog-search-result-code">' +
          TPP.esc(entry.value) +
          '</span><span class="classification-dialog-search-result-main">' +
          '<span class="classification-dialog-search-result-label">' +
          TPP.esc(entry.label) +
          "</span></span></button>"
        );
      })
      .join("");
  };
  TPP.closeBookInfoPickerResults = function () {
    const list = document.getElementById("bookInfoPickerResults");
    if (!list) return;
    list.hidden = true;
    list.innerHTML = "";
    TPP.bookInfoPickerState.activeIndex = -1;
  };
  TPP.renderBookInfoPickerDialog = function () {
    const kind = TPP.bookInfoPickerState.kind;
    const title = document.getElementById("bookInfoPickerDialogTitle");
    const selection = document.getElementById("bookInfoPickerSelection");
    const searchInput = document.getElementById("bookInfoPickerSearch");
    const list = document.getElementById("bookInfoPickerList");
    const row = document.querySelector(
      '.book-info-entry[data-entry-id="' +
        TPP.bookInfoPickerState.entryId +
        '"]',
    );
    const currentValue = TPP.normalizeBookInfoPickerValue(
      kind,
      row && row.querySelector(".book-info-value")
        ? row.querySelector(".book-info-value").value
        : "",
    );
    const summary = TPP.bookInfoPickerSummary(kind, currentValue);
    const results = TPP.bookInfoPickerResults(
      kind,
      TPP.bookInfoPickerState.query,
      currentValue,
    );
    if (title) {
      title.textContent = "Choose " + TPP.bookInfoPickerKindLabel(kind);
    }
    if (selection) {
      selection.innerHTML =
        "<strong>" +
        TPP.esc(summary.title) +
        '</strong><div class="small">' +
        TPP.esc(summary.meta) +
        "</div>";
    }
    if (searchInput) searchInput.value = TPP.bookInfoPickerState.query || "";
    if (list) {
      list.innerHTML = results.length
        ? results
            .map(function (entry) {
              return (
                '<div class="classification-option"><div><strong>' +
                TPP.esc(entry.value) +
                '</strong> <span class="classification-short-label">' +
                TPP.esc(entry.label) +
                '</span></div><div class="toolbar"><button type="button" data-book-info-picker-use="' +
                TPP.esc(entry.value) +
                '">Use</button></div></div>'
              );
            })
            .join("")
        : '<div class="front-cover-field-empty">No matches found.</div>';
    }
    TPP.renderBookInfoPickerResults(
      results,
      TPP.bookInfoPickerState.activeIndex,
    );
  };
  TPP._openBookInfoPickerDialog = async function (kind, entryId) {
    const dialog = document.getElementById("bookInfoPickerDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    const targetKind = kind === "region" ? "region" : "language";
    await TPP.bookInfoPickerCatalogForKind(targetKind);
    TPP.bookInfoPickerState.kind = targetKind;
    TPP.bookInfoPickerState.entryId = String(entryId || "");
    TPP.bookInfoPickerState.query = "";
    TPP.bookInfoPickerState.activeIndex = -1;
    TPP.renderBookInfoPickerDialog();
    if (!dialog.open) dialog.showModal();
    const searchInput = document.getElementById("bookInfoPickerSearch");
    if (searchInput) {
      window.setTimeout(function () {
        searchInput.focus();
        searchInput.select();
      }, 0);
    }
  };
  TPP.applyBookInfoPickerValue = function (value) {
    const row = document.querySelector(
      '.book-info-entry[data-entry-id="' +
        TPP.bookInfoPickerState.entryId +
        '"]',
    );
    const input = row && row.querySelector(".book-info-value");
    if (!input) return;
    input.value = TPP.normalizeBookInfoPickerValue(
      TPP.bookInfoPickerState.kind,
      value,
    );
    TPP.sync("commit");
    TPP.loadForm();
    TPP.renderAll();
  };
  const dialog = document.getElementById("bookInfoPickerDialog");
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close("cancel");
        return;
      }
      const closeButton = e.target.closest(
        "[data-action='cancel-book-info-picker']",
      );
      if (closeButton && dialog.open) {
        dialog.close("cancel");
        return;
      }
      const selectButton = e.target.closest("[data-book-info-picker-use]");
      if (selectButton) {
        TPP.applyBookInfoPickerValue(
          selectButton.dataset.bookInfoPickerUse || "",
        );
        if (dialog.open) dialog.close("selected");
        return;
      }
      const resultButton = e.target.closest("[data-book-info-picker-select]");
      if (resultButton) {
        TPP.applyBookInfoPickerValue(
          resultButton.dataset.bookInfoPickerSelect || "",
        );
        if (dialog.open) dialog.close("selected");
      }
    });
    dialog.addEventListener("input", function (e) {
      const searchInput = e.target.closest("#bookInfoPickerSearch");
      if (!searchInput) return;
      TPP.bookInfoPickerState.query = searchInput.value || "";
      const results = TPP.bookInfoPickerResults(
        TPP.bookInfoPickerState.kind,
        TPP.bookInfoPickerState.query,
      );
      TPP.bookInfoPickerState.activeIndex = results.length ? 0 : -1;
      TPP.renderBookInfoPickerDialog();
    });
    dialog.addEventListener("keydown", function (e) {
      const searchInput = e.target.closest("#bookInfoPickerSearch");
      if (!searchInput) return;
      const results = TPP.bookInfoPickerResults(
        TPP.bookInfoPickerState.kind,
        TPP.bookInfoPickerState.query,
      );
      if (!results.length) {
        if (e.key === "Escape") TPP.closeBookInfoPickerResults();
        return;
      }
      const currentIndex = Number(TPP.bookInfoPickerState.activeIndex || 0);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % results.length;
        TPP.bookInfoPickerState.activeIndex = nextIndex;
        TPP.renderBookInfoPickerResults(results, nextIndex);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const nextIndex = (currentIndex - 1 + results.length) % results.length;
        TPP.bookInfoPickerState.activeIndex = nextIndex;
        TPP.renderBookInfoPickerResults(results, nextIndex);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        TPP.applyBookInfoPickerValue(results[currentIndex].value);
        if (dialog.open) dialog.close("selected");
        return;
      }
      if (e.key === "Escape") TPP.closeBookInfoPickerResults();
    });
  }
  return { open: TPP._openBookInfoPickerDialog };
}
