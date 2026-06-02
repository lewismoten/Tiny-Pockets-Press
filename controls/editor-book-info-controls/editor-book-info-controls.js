let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;
  let authorDialogTargetEntryId = "";

  const authorDialogEntries = function () {
    const dialog = document.getElementById("bookInfoAuthorDialog");
    return Array.isArray(dialog && dialog._authorEntries) ? dialog._authorEntries : [];
  };
  const setAuthorDialogEntries = function (entries) {
    const dialog = document.getElementById("bookInfoAuthorDialog");
    if (dialog) dialog._authorEntries = TPP.authorEntriesFromValue(entries);
  };
  const renderAuthorDialog = function () {
    const list = document.getElementById("bookInfoAuthorDialogList");
    if (!list) return;
    const entries = authorDialogEntries();
    list.innerHTML = entries
      .map(function (entry, index) {
        return (
          '<section class="book-info-author-item" data-author-index="' +
          index +
          '"><div class="book-info-author-item-top"><label>Display / Organization<input class="book-info-author-display" value="' +
          TPP.esc(entry.display || "") +
          '" placeholder="Optional literal name"></label><label>Role<select class="book-info-author-role">' +
          TPP.AUTHOR_ROLE_OPTIONS.map(function (role) {
            return (
              '<option value="' +
              TPP.esc(role) +
              '"' +
              (entry.role === role ? " selected" : "") +
              ">" +
              TPP.esc(TPP.authorRoleLabel(role)) +
              "</option>"
            );
          }).join("") +
          '</select></label><div class="book-info-author-item-actions"><button type="button" data-author-move="-1" aria-label="Move author up">↑</button><button type="button" data-author-move="1" aria-label="Move author down">↓</button><button type="button" data-author-remove="1" aria-label="Remove author">Remove</button></div></div><div class="book-info-author-item-names"><label>Prefix<input class="book-info-author-prefix" value="' +
          TPP.esc(entry.prefix || "") +
          '"></label><label>First<input class="book-info-author-first" value="' +
          TPP.esc(entry.first || "") +
          '"></label><label>Middle<input class="book-info-author-middle" value="' +
          TPP.esc(entry.middle || "") +
          '"></label><label>Last<input class="book-info-author-last" value="' +
          TPP.esc(entry.last || "") +
          '"></label><label>Suffix<input class="book-info-author-suffix" value="' +
          TPP.esc(entry.suffix || "") +
          '"></label></div></section>'
        );
      })
      .join("");
  };
  const readAuthorDialog = function () {
    const entries = Array.from(
      document.querySelectorAll("#bookInfoAuthorDialogList .book-info-author-item"),
    ).map(function (item) {
      return TPP.normalizeAuthorEntry({
        id: TPP.uid(),
        display: item.querySelector(".book-info-author-display")?.value || "",
        role: item.querySelector(".book-info-author-role")?.value || "author",
        prefix: item.querySelector(".book-info-author-prefix")?.value || "",
        first: item.querySelector(".book-info-author-first")?.value || "",
        middle: item.querySelector(".book-info-author-middle")?.value || "",
        last: item.querySelector(".book-info-author-last")?.value || "",
        suffix: item.querySelector(".book-info-author-suffix")?.value || "",
      });
    }).filter(function (entry) {
      return (
        entry.display ||
        entry.first ||
        entry.middle ||
        entry.last ||
        entry.prefix ||
        entry.suffix
      );
    });
    setAuthorDialogEntries(entries);
    return entries;
  };
  const openAuthorDialog = function (entryId) {
    const dialog = document.getElementById("bookInfoAuthorDialog");
    const entry = TPP.bookInfoEntryById(TPP.active, entryId);
    if (!dialog || !entry || typeof dialog.showModal !== "function") return;
    authorDialogTargetEntryId = entryId;
    setAuthorDialogEntries(entry.value || "");
    renderAuthorDialog();
    dialog.showModal();
  };
  const saveAuthorDialog = function () {
    const row = document.querySelector(
      '.book-info-entry[data-entry-id="' + authorDialogTargetEntryId + '"]',
    );
    const input = row && row.querySelector(".book-info-value");
    const dialog = document.getElementById("bookInfoAuthorDialog");
    if (!input) return;
    const value = TPP.authorEntriesValue(readAuthorDialog());
    input.value = value;
    TPP.sync("draft");
    TPP.loadForm();
    TPP.renderCurrentViewPreservingSidebar();
    if (dialog && dialog.open) dialog.close("save");
  };

  const confirmRemoval = function (label, references) {
    const dialog = document.getElementById("bookInfoRemoveDialog");
    const body = document.getElementById("bookInfoRemoveDialogBody");
    const usageWrap = document.getElementById("bookInfoRemoveDialogUsageWrap");
    const usageList = document.getElementById("bookInfoRemoveDialogUsageList");
    const title = document.getElementById("bookInfoRemoveDialogTitle");
    if (!dialog || typeof dialog.showModal !== "function") {
      return Promise.resolve(
        window.confirm(
          'Remove "' +
            label +
            '" and all references to it?\n\nUsed in:\n- ' +
            references
              .map(function (item) {
                return item.label;
              })
              .join("\n- "),
        ),
      );
    }
    if (title) title.textContent = 'Remove "' + label + '"?';
    if (body) {
      body.textContent = references.length
        ? "This field is currently in use. Removing it will also remove all linked text placements."
        : "Remove this field from Book Info?";
    }
    if (usageWrap && usageList) {
      usageList.innerHTML = references
        .map(function (item) {
          return "<li>" + TPP.esc(item.label) + "</li>";
        })
        .join("");
      usageWrap.hidden = !references.length;
    }
    return new Promise(function (resolve) {
      const cleanup = function (value) {
        dialog.removeEventListener("click", clickHandler);
        dialog.removeEventListener("cancel", cancelHandler);
        dialog.removeEventListener("close", closeHandler);
        resolve(value);
      };
      const closeHandler = function () {
        cleanup(dialog.returnValue === "confirm");
      };
      const cancelHandler = function () {
        cleanup(false);
      };
      const clickHandler = function (e) {
        const card = e.target.closest(".modal-card");
        if (e.target === dialog && !card && dialog.open) {
          dialog.close("cancel");
          return;
        }
        const action = e.target.closest("[data-action]")?.dataset.action;
        if (!action) return;
        if (action === "cancel" && dialog.open) {
          dialog.close("cancel");
          return;
        }
        if (action === "confirm" && dialog.open) {
          dialog.close("confirm");
        }
      };
      dialog.addEventListener("click", clickHandler);
      dialog.addEventListener("cancel", cancelHandler, { once: true });
      dialog.addEventListener("close", closeHandler, { once: true });
      dialog.showModal();
    });
  };

  const authorDialog = document.getElementById("bookInfoAuthorDialog");
  if (authorDialog) {
    authorDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === authorDialog && !card && authorDialog.open) {
        authorDialog.close("cancel");
        return;
      }
      const action = e.target.closest("[data-author-action]")?.dataset.authorAction;
      if (action === "cancel" && authorDialog.open) {
        authorDialog.close("cancel");
        return;
      }
      if (action === "save" && authorDialog.open) {
        saveAuthorDialog();
        return;
      }
      if (e.target.closest("#bookInfoAuthorDialogAdd")) {
        readAuthorDialog();
        const next = authorDialogEntries();
        next.push(
          TPP.normalizeAuthorEntry({
            role: next.length ? "contributor" : "author",
          }),
        );
        setAuthorDialogEntries(next);
        renderAuthorDialog();
        return;
      }
      const authorItem = e.target.closest(".book-info-author-item");
      if (!authorItem) return;
      const index = Math.max(
        0,
        Number(authorItem.dataset.authorIndex) || 0,
      );
      if (e.target.closest("[data-author-remove]")) {
        readAuthorDialog();
        const next = authorDialogEntries();
        next.splice(index, 1);
        setAuthorDialogEntries(next);
        renderAuthorDialog();
        return;
      }
      const move = Number(
        e.target.closest("[data-author-move]")?.dataset.authorMove,
      );
      if (move) {
        readAuthorDialog();
        const next = authorDialogEntries();
        const swapIndex = index + move;
        if (swapIndex < 0 || swapIndex >= next.length) return;
        const item = next.splice(index, 1)[0];
        next.splice(swapIndex, 0, item);
        setAuthorDialogEntries(next);
        renderAuthorDialog();
      }
    });
  }

  return {
    handleInput(event) {
      const entry = event.target.closest(".book-info-entry");
      if (!entry) return false;
      TPP.sync("draft");
      TPP.scheduleEditorRender("preserve", { debounce: true, delay: 64 });
      return true;
    },
    handleChange(event) {
      const entry = event.target.closest(".book-info-entry");
      if (!entry) return false;
      TPP.sync("draft");
      TPP.scheduleEditorRender("preserve");
      return true;
    },
    async handleClick(event) {
      const pickerButton = event.target.closest("[data-book-info-picker]");
      if (pickerButton) {
        TPP.sync("nosave");
        TPP.openBookInfoPickerDialog(
          pickerButton.dataset.bookInfoPickerKind,
          pickerButton.dataset.bookInfoPicker,
        );
        return true;
      }

      const classificationButton = event.target.closest(
        "[data-book-info-classification]",
      );
      if (classificationButton) {
        TPP.sync("nosave");
        TPP.openClassificationDialog(
          classificationButton.dataset.bookInfoClassification,
        );
        return true;
      }

      const authorButton = event.target.closest("[data-book-info-authors]");
      if (authorButton) {
        TPP.sync("nosave");
        openAuthorDialog(authorButton.dataset.bookInfoAuthors);
        return true;
      }

      const actionButton = event.target.closest("[data-book-info-action]");
      if (actionButton) {
        TPP.sync("nosave");
        const group = actionButton.closest(".book-info-entry");
        if (group) {
          const entry = TPP.bookInfoEntryById(TPP.active, group.dataset.entryId);
          const references = entry
            ? TPP.bookInfoUsageReferences(TPP.active, entry)
            : [];
          if (references.length) {
            const label = TPP.bookInfoFieldLabel(
              entry.key === "custom" ? "custom:" + entry.id : entry.key,
              TPP.active,
            );
            const confirmed = await confirmRemoval(label, references);
            if (!confirmed) return true;
            TPP.removeBookInfoReferences(TPP.active, entry);
          }
          TPP.removeBookInfoEntry(TPP.active, group.dataset.entryId);
        }
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.loadForm();
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      const addButton = event.target.closest("#bookInfoAddButton");
      if (addButton) {
        const select = document.getElementById("bookInfoAddField");
        const value = select && select.value;
        if (!value) return true;
        TPP.sync("nosave");
        TPP.addBookInfoEntry(TPP.active, value);
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.loadForm();
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      return false;
    },
  };
}
