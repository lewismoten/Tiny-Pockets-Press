let initialized = false;

export async function init(TPP) {
  if (initialized) {
    return {
      open: TPP._openAssetDialog,
      close: TPP._closeAssetDialog,
      render: TPP._renderAssetDialog,
    };
  }
  initialized = true;
  TPP._renderAssetDialog = function () {
    const dialog = document.getElementById("assetDialog");
    const title = document.getElementById("assetDialogTitle");
    const text = document.getElementById("assetDialogText");
    const list = document.getElementById("assetDialogList");
    const clearButton = document.getElementById("assetClearButton");
    if (!dialog || !title || !text || !list) return;
    const target = TPP.assetDialogTarget;
    const spec = target ? TPP.assetTargetSpec(target.type, target.key) : null;
    const currentId = target
      ? TPP.assetTargetValue(target.type, target.key)
      : "";
    title.textContent = spec ? spec.label : "Choose Image";
    text.textContent = spec
      ? "Reuse an existing image, upload a new one, or remove the current assignment."
      : "";
    if (clearButton) clearButton.disabled = !currentId;
    const files = TPP.filePickerAssets
      ? TPP.filePickerAssets(TPP.active)
      : TPP.active && Array.isArray(TPP.active.files)
        ? TPP.active.files
        : [];
    list.innerHTML = files.length
      ? files
          .map(function (file) {
            return TPP.assetCardHtml(file, currentId);
          })
          .join("")
      : '<div class="asset-empty">No images have been uploaded for this book yet.</div>';
  };
  TPP._openAssetDialog = function (targetType, targetKey) {
    const dialog = document.getElementById("assetDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    TPP.sync("nosave");
    TPP.assetDialogTarget = { type: targetType, key: targetKey };
    TPP._renderAssetDialog();
    if (!dialog.open) dialog.showModal();
  };
  TPP.commitAssetChange = function () {
    TPP.save("commit", TPP.active && TPP.bookId(TPP.active));
    TPP.loadForm();
    TPP.renderAll();
    const dialog = document.getElementById("assetDialog");
    if (dialog && dialog.open) TPP._renderAssetDialog();
  };
  TPP._closeAssetDialog = function () {
    const dialog = document.getElementById("assetDialog");
    if (dialog && dialog.open) dialog.close();
  };
  TPP.assignAssetToCurrentTarget = function (fileId) {
    const target = TPP.assetDialogTarget;
    if (!target || !TPP.active) return;
    if (!TPP.setAssetTargetValue(target.type, target.key, fileId)) return;
    TPP.commitAssetChange();
    TPP._closeAssetDialog();
  };
  TPP.uploadAssetToCurrentTarget = function (data, file) {
    if (!TPP.active) return;
    const fileId = TPP.upsertFileAsset(
      TPP.active,
      data,
      file && file.type,
      file && file.name,
    );
    TPP.assignAssetToCurrentTarget(fileId);
  };
  TPP.deleteAsset = function (fileId) {
    if (!TPP.active || !fileId) return;
    if (!TPP.removeFileAsset(TPP.active, fileId)) return;
    TPP.commitAssetChange();
  };
  const dialog = document.getElementById("assetDialog");
  const uploadButton = document.getElementById("assetUploadButton");
  const uploadInput = document.getElementById("assetUploadInput");
  const clearButton = document.getElementById("assetClearButton");
  if (dialog) {
    dialog.addEventListener("close", function () {
      TPP.assetDialogTarget = null;
    });
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close();
        return;
      }
      const useButton = e.target.closest("[data-asset-use]");
      if (useButton) {
        TPP.assignAssetToCurrentTarget(useButton.dataset.assetUse || "");
        return;
      }
      const deleteButton = e.target.closest("[data-asset-delete]");
      if (deleteButton) {
        TPP.deleteAsset(deleteButton.dataset.assetDelete || "");
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && dialog.open) dialog.close();
    });
  }
  if (uploadButton && uploadInput) {
    uploadButton.onclick = function () {
      uploadInput.value = "";
      uploadInput.click();
    };
    uploadInput.onchange = function (e) {
      TPP.file(e, function (data, file) {
        TPP.uploadAssetToCurrentTarget(data, file);
        uploadInput.value = "";
      });
    };
  }
  if (clearButton) {
    clearButton.onclick = function () {
      TPP.assignAssetToCurrentTarget("");
    };
  }
  return {
    open: TPP._openAssetDialog,
    close: TPP._closeAssetDialog,
    render: TPP._renderAssetDialog,
  };
}
