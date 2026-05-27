window.TPP = window.TPP || {};

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
TPP.textElementUiSpecs = {
  cover: [
    {
      location: "front",
      part: "title",
      label: "Title",
      minSize: 4,
      supportsX: false,
      supportsWidth: false,
      supportsAlign: false,
      supportsRotate: false,
    },
    {
      location: "front",
      part: "author",
      label: "Author",
      minSize: 3,
      supportsX: false,
      supportsWidth: false,
      supportsAlign: false,
      supportsRotate: false,
    },
    {
      location: "front",
      part: "series",
      label: "Series / Number",
      minSize: 3,
      supportsX: false,
      supportsWidth: false,
      supportsAlign: false,
      supportsRotate: false,
    },
    {
      location: "front",
      part: "publisher",
      label: "Publisher",
      minSize: 3,
      supportsX: false,
      supportsWidth: false,
      supportsAlign: false,
      supportsRotate: false,
    },
  ],
  spine: [
    {
      location: "spine",
      part: "title",
      label: "Title",
      minSize: 3,
      supportsX: true,
      supportsWidth: true,
      supportsAlign: true,
      supportsRotate: true,
    },
    {
      location: "spine",
      part: "author",
      label: "Author",
      minSize: 3,
      supportsX: true,
      supportsWidth: true,
      supportsAlign: true,
      supportsRotate: true,
    },
  ],
};
TPP.textElementGroupHtml = function (book, spec) {
  const element = TPP.findTextElement(book, spec.location, spec.part) || {};
  const key = TPP.textElementKey(spec.location, spec.part);
  const align =
    element.align || (spec.location === "front" ? "center" : "left");
  return (
    '<section class="cover-text-group text-element-group" data-text-key="' +
    TPP.esc(key) +
    '" data-location="' +
    TPP.esc(spec.location) +
    '" data-part="' +
    TPP.esc(spec.part) +
    '">' +
    '<label><input class="text-enabled" type="checkbox" ' +
    (element.enabled !== false ? "checked" : "") +
    "> Show " +
    TPP.esc(spec.label.toLowerCase()) +
    "</label>" +
    '<div class="two">' +
    '<label>Size <input class="text-size" type="number" min="' +
    spec.minSize +
    '" step=".5" value="' +
    TPP.esc(String(Number(element.size) || spec.minSize)) +
    '"></label>' +
    '<label>Y <input class="text-y" type="range" min="0" max="100" value="' +
    TPP.esc(String(Number(element.y) || 0)) +
    '"></label>' +
    "</div>" +
    (spec.supportsX
      ? '<div class="two"><label>X <input class="text-x" type="range" min="0" max="100" value="' +
        TPP.esc(String(Number(element.x) || 50)) +
        '"></label><label>Width <input class="text-width" type="range" min="10" max="100" value="' +
        TPP.esc(String(Number(element.width) || 100)) +
        '"></label></div>'
      : "") +
    (spec.supportsAlign
      ? '<div class="two"><label>Align<select class="text-align"><option value="left"' +
        (align === "left" ? " selected" : "") +
        '>Left</option><option value="center"' +
        (align === "center" ? " selected" : "") +
        '>Center</option><option value="justify"' +
        (align === "justify" ? " selected" : "") +
        '>Justify</option><option value="right"' +
        (align === "right" ? " selected" : "") +
        '>Right</option><option value="clip"' +
        (align === "clip" ? " selected" : "") +
        ">Clip</option></select></label>" +
        (spec.supportsRotate
          ? '<label><input class="text-rotate" type="checkbox" ' +
            (element.rotate ? "checked" : "") +
            "> Rotate 90°</label>"
          : "") +
        "</div>"
      : "") +
    '<div class="two"><label>Color <input class="text-color color-box" type="color" value="' +
    TPP.esc(element.color || "#ffffff") +
    '"></label><label>Outline <input class="text-outline-color color-box" type="color" value="' +
    TPP.esc(element.outlineColor || "#000000") +
    '"></label></div>' +
    '<label>Outline px <input class="text-outline-size" type="number" min="0" step=".25" value="' +
    TPP.esc(String(Math.max(0, Number(element.outlineSize) || 0))) +
    '"></label>' +
    "</section>"
  );
};
TPP.renderTextElementControls = function () {
  const cover = document.getElementById("coverTextElements");
  const spine = document.getElementById("spineTextElements");
  if (cover) {
    cover.className = "cover-text-grid";
    cover.innerHTML = TPP.textElementUiSpecs.cover
      .map(function (spec) {
        return TPP.textElementGroupHtml(TPP.active, spec);
      })
      .join("");
  }
  if (spine) {
    spine.className = "cover-text-grid";
    spine.innerHTML = TPP.textElementUiSpecs.spine
      .map(function (spec) {
        return TPP.textElementGroupHtml(TPP.active, spec);
      })
      .join("");
  }
};
TPP.readTextElementControls = function (book) {
  const groups = Array.from(document.querySelectorAll(".text-element-group"));
  if (!groups.length || !book) return;
  groups.forEach(function (group) {
    const element = TPP.findTextElement(
      book,
      group.dataset.location,
      group.dataset.part,
    );
    if (!element) return;
    element.enabled = group.querySelector(".text-enabled")?.checked !== false;
    element.size =
      Number(group.querySelector(".text-size")?.value) || element.size || 4;
    element.y = Number(group.querySelector(".text-y")?.value) || 0;
    if (group.querySelector(".text-x"))
      element.x = Number(group.querySelector(".text-x").value) || 50;
    if (group.querySelector(".text-width"))
      element.width = Math.max(
        10,
        Math.min(100, Number(group.querySelector(".text-width").value) || 100),
      );
    if (group.querySelector(".text-align"))
      element.align = group.querySelector(".text-align").value || "left";
    if (group.querySelector(".text-rotate"))
      element.rotate = group.querySelector(".text-rotate").checked;
    element.color = group.querySelector(".text-color")?.value || element.color;
    element.outlineColor =
      group.querySelector(".text-outline-color")?.value || element.outlineColor;
    element.outlineSize = Math.max(
      0,
      Number(group.querySelector(".text-outline-size")?.value) || 0,
    );
  });
  if (TPP.syncLegacyTextFieldsFromElements)
    TPP.syncLegacyTextFieldsFromElements(book);
};

TPP.populate = function () {
  document.getElementById("fontFamily").innerHTML = TPP.fonts
    .map(function (pair) {
      return (
        '<option value="' + TPP.esc(pair[0]) + '">' + pair[1] + "</option>"
      );
    })
    .join("");
  document.getElementById("paperPreset").innerHTML = Object.entries(TPP.papers)
    .map(function (entry) {
      return '<option value="' + entry[0] + '">' + entry[1][0] + "</option>";
    })
    .join("");
  document.getElementById("texture").innerHTML = Object.entries(TPP.textures)
    .map(function (entry) {
      return '<option value="' + entry[0] + '">' + entry[1] + "</option>";
    })
    .join("");
};
TPP.loadForm = function () {
  const book = TPP.active;
  if (book) book.signatureSize = TPP.signatureSize(book.signatureSize);
  if (book) book.sewingStations = TPP.sewingStations(book.sewingStations);
  if (book)
    book.sewingGuideOpacity = TPP.opacity(book.sewingGuideOpacity, 0.65);
  if (book)
    book.signatureGuideOpacity = TPP.opacity(book.signatureGuideOpacity, 0.65);
  if (book) book.imageExportDpi = TPP.dpi(book.imageExportDpi);
  if (book)
    book.mediaCaptionSize = TPP.mediaCaptionSize(
      book.mediaCaptionSize,
      book.captionSize,
    );
  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(book[id]);
    else el.value = book[id] ?? "";
  });
  document.querySelector(".customSize").hidden =
    document.getElementById("pageSize").value !== "custom";
  if (TPP.renderTextElementControls) TPP.renderTextElementControls();
  TPP.renderChapterList();
  TPP.renderChapterEditor();
  if (TPP.refreshAssetSlots) TPP.refreshAssetSlots();
};
TPP.sync = function (mode) {
  const book = TPP.active;
  if (!book) return;
  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") book[id] = el.checked;
    else if (el.type === "number" || el.type === "range")
      book[id] = Number(el.value);
    else book[id] = el.value;
  });
  if (TPP.syncTextElementsFromLegacyFields)
    TPP.syncTextElementsFromLegacyFields(book);
  book.signatureSize = TPP.signatureSize(book.signatureSize);
  book.sewingStations = TPP.sewingStations(book.sewingStations);
  book.sewingGuideOpacity = TPP.opacity(book.sewingGuideOpacity, 0.65);
  book.signatureGuideOpacity = TPP.opacity(book.signatureGuideOpacity, 0.65);
  book.imageExportDpi = TPP.dpi(book.imageExportDpi);
  book.mediaCaptionSize = TPP.mediaCaptionSize(
    book.mediaCaptionSize,
    book.captionSize,
  );
  const signature = document.getElementById("signatureSize");
  if (signature) signature.value = book.signatureSize;
  const sewing = document.getElementById("sewingStations");
  if (sewing) sewing.value = book.sewingStations;
  const sewingOpacity = document.getElementById("sewingGuideOpacity");
  if (sewingOpacity) sewingOpacity.value = book.sewingGuideOpacity;
  const signatureOpacity = document.getElementById("signatureGuideOpacity");
  if (signatureOpacity) signatureOpacity.value = book.signatureGuideOpacity;
  const imageExportDpi = document.getElementById("imageExportDpi");
  if (imageExportDpi) imageExportDpi.value = book.imageExportDpi;
  const mediaCaptionSize = document.getElementById("mediaCaptionSize");
  if (mediaCaptionSize) mediaCaptionSize.value = book.mediaCaptionSize;
  if (TPP.readTextElementControls) TPP.readTextElementControls(book);
  book.chapters = TPP.readChapterFromEditor();
  if (TPP.syncImageElementsFromLegacyFields)
    TPP.syncImageElementsFromLegacyFields(book);
  if (TPP.syncLegacyImageFieldsFromElements)
    TPP.syncLegacyImageFieldsFromElements(book);
  if (mode !== "nosave") {
    TPP.save(mode || "commit", book.id);
    if (mode === "draft") TPP.scheduleRevisionCommit(book.id);
  }
};
TPP.readChapterFromEditor = function () {
  const card = document.querySelector(".chapter-card");
  if (!card) return TPP.active.chapters;
  const copy = TPP.active.chapters.map(function (chapter) {
    return Object.assign({}, chapter);
  });
  const index = Number(card.dataset.index);
  const chapter = copy[index];
  if (chapter) {
    chapter.title = card.querySelector(".chapter-title").value;
    chapter.text = card.querySelector(".chapter-text").value;
    chapter.imagePlacement = card.querySelector(
      ".chapter-image-placement",
    ).value;
    chapter.imageZoom = Math.min(
      100,
      Math.max(
        10,
        Number(card.querySelector(".chapter-image-zoom").value) || 70,
      ),
    );
    chapter.imageWidth = chapter.imageZoom;
    chapter.imageRotate =
      Number(card.querySelector(".chapter-image-rotate").value) || 0;
    chapter.level = Number(card.querySelector(".chapter-level").value) || 0;
    chapter.isSubsection = card.querySelector(".chapter-subsection").checked;
    chapter.isMetadata = card.querySelector(".chapter-metadata").checked;
    chapter.includeInToc = card.querySelector(".chapter-toc").checked;
    chapter.tocTitle = card.querySelector(".chapter-toc-title").value;
  }
  return copy;
};
TPP.renderChapterList = function () {
  document.getElementById("chapterList").innerHTML = TPP.active.chapters
    .map(function (chapter, index) {
      return (
        '<div class="chapter-pill ' +
        (index === TPP.currentChapter ? "active" : "") +
        '" data-i="' +
        index +
        '" style="--level:' +
        (chapter.level || 0) +
        '">' +
        '<span class="indent"></span><button class="small" data-act="select">' +
        (index + 1) +
        ". " +
        TPP.esc(chapter.title || "Untitled") +
        '</button><button class="small" data-act="up">↑</button><button class="small" data-act="down">↓</button><button class="small" data-act="outdent">←</button><button class="small" data-act="indent">→</button></div>'
      );
    })
    .join("");
};
TPP.previewWithBreaks = function (text) {
  const settings = TPP.active || TPP.fallbackBook();
  const blocks = TPP.blocksFromText(text, settings)
    .map(function (block) {
      return block.html;
    })
    .join("");
  const parts = blocks.split(/<\/p>/);
  return parts
    .map(function (part, index) {
      return (
        part +
        (part.includes("<p") ? "</p>" : "") +
        (index % 2 === 1
          ? '<div class="page-break">Page break estimate</div>'
          : "")
      );
    })
    .join("");
};
TPP.metadataPreview = function (text) {
  const meta = TPP.parseChapterMetadata({ text: text });
  if (!meta) return '<div class="meta">Invalid metadata JSON</div>';
  if (meta.type === "blank")
    return '<div class="meta">Blank pages: ' + meta.pages + "</div>";
  return '<div class="meta">Unsupported metadata type</div>';
};
TPP.renderChapterEditor = function () {
  const chapter =
    TPP.active.chapters[TPP.currentChapter] || TPP.active.chapters[0];
  if (!chapter) {
    document.getElementById("chapterEditor").innerHTML = "";
    return;
  }
  document.getElementById("chapterEditor").innerHTML =
    '<article class="chapter-card" data-index="' +
    TPP.currentChapter +
    '">' +
    '<div class="toolbar"><button data-main="remove">Remove</button><button data-main="read">Read From Here</button></div>' +
    '<label>Chapter Title <input class="chapter-title" value="' +
    TPP.esc(chapter.title) +
    '"></label>' +
    '<label>TOC Name <input class="chapter-toc-title" placeholder="Optional shorter table of contents name" value="' +
    TPP.esc(chapter.tocTitle || "") +
    '"></label>' +
    '<div class="two"><label>Level <input class="chapter-level" type="number" min="0" max="6" value="' +
    (chapter.level || 0) +
    '"></label><label><input class="chapter-subsection" type="checkbox" ' +
    (chapter.isSubsection ? "checked" : "") +
    "> Sub-section</label></div>" +
    '<label><input class="chapter-metadata" type="checkbox" ' +
    (chapter.isMetadata ? "checked" : "") +
    "> Content is metadata JSON</label>" +
    '<label><input class="chapter-toc" type="checkbox" ' +
    (chapter.includeInToc !== false ? "checked" : "") +
    "> Appears in table of contents</label>" +
    '<div class="toolbar"><button data-fmt="bold">Bold</button><button data-fmt="italic">Italic</button><button data-fmt="underline">Underline</button><button data-fmt="strike">Strike</button><button data-fmt="ul">Bullets</button><button data-fmt="h2">Heading</button><button data-fmt="table">Table</button></div>' +
    '<div class="editor-grid"><label>' +
    (chapter.isMetadata ? "Metadata JSON" : "Markdown") +
    '<textarea class="chapter-text" placeholder="' +
    (chapter.isMetadata
      ? "{&quot;type&quot;:&quot;blank&quot;,&quot;pages&quot;:12}"
      : "") +
    '">' +
    TPP.esc(chapter.text || "") +
    '</textarea></label><div><strong>Preview</strong><div class="md-preview">' +
    (chapter.isMetadata
      ? TPP.metadataPreview(chapter.text || "")
      : TPP.previewWithBreaks(chapter.text || "")) +
    "</div></div></div>" +
    '<div class="two"><label>Image Placement<select class="chapter-image-placement"><option value="none" ' +
    (chapter.imagePlacement === "none" ? "selected" : "") +
    '>No Image</option><option value="below" ' +
    (chapter.imagePlacement === "below" ? "selected" : "") +
    '>Below Title</option><option value="own" ' +
    (chapter.imagePlacement === "own" ? "selected" : "") +
    '>Own Page</option></select></label><label>Image Zoom %<input class="chapter-image-zoom" type="number" min="10" max="100" value="' +
    (chapter.imageZoom || chapter.imageWidth || 70) +
    '"></label></div>' +
    '<label>Image Rotate <input class="chapter-image-rotate" type="range" min="-180" max="180" step="1" value="' +
    (Number(chapter.imageRotate) || 0) +
    '"></label>' +
    TPP.assetFieldHtml(
      "Chapter Image",
      "chapter",
      chapter.id,
      chapter.imageId,
      chapter.title || "Chapter image",
    ) +
    "</article>";
  TPP.renderQr(document.getElementById("chapterEditor"));
};
