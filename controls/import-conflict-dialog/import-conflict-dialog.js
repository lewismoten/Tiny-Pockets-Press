let initialized = false;

export async function init(TPP) {
  if (initialized) return { resolve: TPP._resolveImportConflict };
  initialized = true;
  TPP._resolveImportConflict = function (incoming, existing) {
    const dialog = document.getElementById("importConflictDialog");
    const text = document.getElementById("importConflictText");
    const books = document.getElementById("importConflictBooks");
    if (!dialog || !text || !books || typeof dialog.showModal !== "function") {
      return Promise.resolve("cancel");
    }
    text.textContent =
      'A book with id "' +
      (TPP.bookId(incoming) || "") +
      '" already exists. Choose how to handle this import.';
    books.innerHTML =
      '<div><div class="about-meta-label">Current Library Book</div>' +
      TPP.importConflictPreview(existing) +
      "</div>" +
      '<div><div class="about-meta-label">Incoming Import</div>' +
      TPP.importConflictPreview(incoming) +
      "</div>";
    return new Promise(function (resolve) {
      const handlers = [];
      const cleanup = function () {
        handlers.forEach(function (entry) {
          entry.button.removeEventListener("click", entry.handler);
        });
        dialog.removeEventListener("cancel", cancelHandler);
        dialog.removeEventListener("close", closeHandler);
      };
      const finish = function (action) {
        cleanup();
        if (dialog.open) dialog.close();
        resolve(action || "cancel");
      };
      Array.from(dialog.querySelectorAll("[data-action]")).forEach(
        function (button) {
          const handler = function () {
            finish(button.dataset.action);
          };
          handlers.push({ button: button, handler: handler });
          button.addEventListener("click", handler);
        },
      );
      const cancelHandler = function (event) {
        event.preventDefault();
        finish("cancel");
      };
      const closeHandler = function () {
        finish("cancel");
      };
      dialog.addEventListener("cancel", cancelHandler);
      dialog.addEventListener("close", closeHandler);
      dialog.showModal();
    });
  };
  return { resolve: TPP._resolveImportConflict };
}
