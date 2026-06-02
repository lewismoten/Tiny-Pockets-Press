window.TPP = window.TPP || {};

TPP.assetDialogTarget = null;

TPP.assetName = function (book, fileId) {
  const file = TPP.fileAsset(book, fileId);
  if (!file) return "No image selected";
  return file.name || "Image selected";
};

TPP.assetPreviewHtml = function (book, fileId, alt) {
  const src = TPP.fileData(book, fileId);
  if (!src) return '<div class="asset-empty">No image selected</div>';
  return (
    '<img src="' +
    TPP.esc(src) +
    '" alt="' +
    TPP.esc(alt || "Selected image") +
    '" class="asset-preview">'
  );
};

TPP.assetFieldHtml = function (label, targetType, targetKey, fileId, alt) {
  return (
    '<div class="asset-field">' +
    '<button type="button" class="asset-picker-surface asset-picker-open" data-target-type="' +
    TPP.esc(targetType) +
    '" data-target-key="' +
    TPP.esc(targetKey) +
    '">' +
    '<div class="asset-field-copy"><div class="asset-field-head"><strong>' +
    TPP.esc(label) +
    '</strong><span class="small asset-inline-action">Choose Image</span></div>' +
    '<div class="asset-field-meta">' +
    TPP.esc(TPP.assetName(TPP.active, fileId)) +
    "</div></div>" +
    TPP.assetPreviewHtml(TPP.active, fileId, alt) +
    "</button>" +
    "</div>"
  );
};

TPP.assetTargetSpec = function (targetType, targetKey) {
  if (targetType === "book") {
    const map = {
      coverImageId: {
        imageElement: TPP.findImageElement(TPP.active, "front", "cover"),
        label: "Front Cover Image",
      },
      backImageId: {
        imageElement: TPP.findImageElement(TPP.active, "back", "cover"),
        label: "Back Cover Image",
      },
      spineImageId: {
        imageElement: TPP.findImageElement(TPP.active, "spine", "cover"),
        label: "Spine Image",
      },
    };
    return map[targetKey] || null;
  }
  if (targetType === "chapter") {
    const chapter = ((TPP.active && TPP.active.chapters) || []).find(
      function (entry) {
        return entry.id === targetKey;
      },
    );
    if (!chapter) return null;
    return {
      chapter: chapter,
      imageElement: TPP.findChapterImageElement(TPP.active, chapter),
      label: 'Chapter Image: "' + (chapter.title || "Untitled") + '"',
    };
  }
  return null;
};

TPP.assetTargetValue = function (targetType, targetKey) {
  const spec = TPP.assetTargetSpec(targetType, targetKey);
  if (!spec) return "";
  return spec.imageElement ? spec.imageElement.fileId || "" : "";
};

TPP.setAssetTargetValue = function (targetType, targetKey, fileId) {
  const spec = TPP.assetTargetSpec(targetType, targetKey);
  if (!spec || !spec.imageElement) return false;
  spec.imageElement.fileId = fileId || "";
  if (spec.chapter) spec.chapter.imageId = spec.imageElement.fileId;
  if (TPP.syncLegacyImageFieldsFromElements) {
    TPP.syncLegacyImageFieldsFromElements(TPP.active);
  }
  return true;
};

TPP.assetSlotHtml = function (label, targetKey, fileId, alt) {
  return TPP.assetFieldHtml(label, "book", targetKey, fileId, alt);
};

TPP.refreshAssetSlots = function () {
  if (!TPP.active) return;
  const coverSlot = document.getElementById("coverImageSlot");
  const backSlot = document.getElementById("backImageSlot");
  const spineSlot = document.getElementById("spineImageSlot");
  const front = TPP.findImageElement(TPP.active, "front", "cover");
  const back = TPP.findImageElement(TPP.active, "back", "cover");
  const spine = TPP.findImageElement(TPP.active, "spine", "cover");
  if (coverSlot) {
    coverSlot.innerHTML = TPP.assetSlotHtml(
      "Cover Image",
      "coverImageId",
      front && front.fileId,
      TPP.active.title || "Cover image",
    );
  }
  if (backSlot) {
    backSlot.innerHTML = TPP.assetSlotHtml(
      "Back Image",
      "backImageId",
      back && back.fileId,
      (TPP.active.title || "Book") + " back image",
    );
  }
  if (spineSlot) {
    spineSlot.innerHTML = TPP.assetSlotHtml(
      "Spine Image",
      "spineImageId",
      spine && spine.fileId,
      (TPP.active.title || "Book") + " spine image",
    );
  }
};

TPP.assetCardHtml = function (file, currentId) {
  const refs = TPP.fileReferences(TPP.active, file.id);
  const canDelete = refs.length === 0;
  return (
    '<article class="asset-card ' +
    (file.id === currentId ? "current" : "") +
    '">' +
    '<button type="button" class="asset-card-preview-button" data-asset-use="' +
    TPP.esc(file.id) +
    '">' +
    '<img class="asset-card-preview" src="' +
    TPP.esc(file.data) +
    '" alt="' +
    TPP.esc(file.name || file.type || "Image asset") +
    '">' +
    "</button>" +
    '<div class="asset-card-meta">' +
    '<div class="asset-card-title">' +
    TPP.esc(file.name || "Image Asset") +
    "</div>" +
    '<div class="asset-card-sub">' +
    TPP.esc(file.id) +
    "</div>" +
    '<div class="asset-card-sub">Hash: ' +
    TPP.esc(file.hash || "") +
    "</div>" +
    '<div class="asset-card-refs">' +
    (refs.length
      ? refs
          .map(function (ref) {
            return '<span class="asset-ref">' + TPP.esc(ref.label) + "</span>";
          })
          .join("")
      : '<span class="asset-ref">Unused</span>') +
    "</div>" +
    "</div>" +
    '<div class="asset-card-actions">' +
    '<button type="button" data-asset-use="' +
    TPP.esc(file.id) +
    '" class="primary alt">' +
    (file.id === currentId ? "Selected" : "Use This Image") +
    "</button>" +
    '<button type="button" data-asset-delete="' +
    TPP.esc(file.id) +
    '"' +
    (canDelete ? "" : " disabled") +
    ">Delete</button>" +
    "</div>" +
    "</article>"
  );
};

TPP.commitAssetChange = function () {
  TPP.save("commit", TPP.active && TPP.bookId(TPP.active));
  TPP.loadForm();
  TPP.renderAll();
  const dialog = document.getElementById("assetDialog");
  if (dialog && dialog.open && TPP._renderAssetDialog) TPP._renderAssetDialog();
};

TPP.assignAssetToCurrentTarget = function (fileId) {
  const target = TPP.assetDialogTarget;
  if (!target || !TPP.active) return;
  if (!TPP.setAssetTargetValue(target.type, target.key, fileId)) return;
  TPP.commitAssetChange();
  if (TPP._closeAssetDialog) TPP._closeAssetDialog();
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
