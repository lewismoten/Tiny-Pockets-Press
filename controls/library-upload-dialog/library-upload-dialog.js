let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openLibraryUploadDialog };
  initialized = true;
  const dialog = document.getElementById("libraryUploadDialog");
  const input = document.getElementById("importJson");
  TPP._openLibraryUploadDialog = function () {
    if (!input) return;
    input.value = "";
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  };
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) dialog.close("cancel");
      const closeButton = e.target.closest("[data-action='cancel']");
      if (closeButton) dialog.close("cancel");
    });
  }
  if (input) {
    input.onchange = async function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (dialog && dialog.open) dialog.close("selected");
      const reader = new FileReader();
      reader.onload = async function () {
        const payload = TPP.unwrapImportPayload(JSON.parse(reader.result));
        if (payload.kind === "library") {
          const stamp = TPP.nowIso();
          for (const rawBook of payload.value) {
            const incoming = TPP.bookImported(rawBook, stamp);
            const existingIndex = TPP.library.findIndex(function (book) {
              return TPP.bookId(book) === TPP.bookId(incoming);
            });
            if (existingIndex < 0) {
              TPP.library.push(incoming);
              continue;
            }
            const existing = TPP.library[existingIndex];
            const action = await TPP.resolveImportConflict(incoming, existing);
            if (action === "merge") {
              TPP.library[existingIndex] = TPP.mergeImportedBook(
                existing,
                incoming,
                stamp,
              );
            } else if (action === "overwrite") {
              TPP.bookMeta(incoming).lastExportedAt =
                TPP.bookLastExportedAt(existing) ||
                TPP.bookLastExportedAt(incoming) ||
                "";
              TPP.library[existingIndex] = incoming;
            } else if (action === "copy") {
              TPP.library.push(
                TPP.bookDescendant(
                  incoming,
                  { id: TPP.uid() },
                  "import",
                  stamp,
                ),
              );
            }
          }
          TPP.save();
          if (TPP.library[0]) TPP.setActive(TPP.library[0]);
          TPP.switchView("library");
          return;
        }
        if (payload.kind === "style") {
          Object.entries(payload.value).forEach(function (entry) {
            TPP.active[entry[0]] = entry[1];
          });
          TPP.save();
          TPP.loadForm();
          TPP.renderAll();
          return;
        }
        {
          const stamp = TPP.nowIso();
          const incoming = TPP.bookImported(payload.value, stamp);
          const existingIndex = TPP.library.findIndex(function (book) {
            return TPP.bookId(book) === TPP.bookId(incoming);
          });
          if (existingIndex < 0) {
            TPP.library.push(incoming);
            TPP.save();
            TPP.setActive(incoming);
            return;
          }
          const existing = TPP.library[existingIndex];
          const action = await TPP.resolveImportConflict(incoming, existing);
          if (action === "cancel") return;
          if (action === "merge") {
            TPP.library[existingIndex] = TPP.mergeImportedBook(
              existing,
              incoming,
              stamp,
            );
          } else if (action === "overwrite") {
            TPP.bookMeta(incoming).lastExportedAt =
              TPP.bookLastExportedAt(existing) ||
              TPP.bookLastExportedAt(incoming) ||
              "";
            TPP.library[existingIndex] = incoming;
          } else if (action === "copy") {
            const copy = TPP.bookDescendant(
              incoming,
              { id: TPP.uid() },
              "import",
              stamp,
            );
            TPP.library.push(copy);
            TPP.save();
            TPP.setActive(copy);
            return;
          }
          TPP.save();
          TPP.setActive(TPP.library[existingIndex]);
        }
      };
      reader.readAsText(file);
    };
  }
  return { open: TPP._openLibraryUploadDialog };
}
