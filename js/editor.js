window.TPP = window.TPP || {};

TPP.populate = function () {
  document.getElementById("fontFamily").innerHTML = TPP.fonts.map(function (pair) {
    return '<option value="' + TPP.esc(pair[0]) + '">' + pair[1] + "</option>";
  }).join("");
  document.getElementById("paperPreset").innerHTML = Object.entries(TPP.papers).map(function (entry) {
    return '<option value="' + entry[0] + '">' + entry[1][0] + "</option>";
  }).join("");
  document.getElementById("texture").innerHTML = Object.entries(TPP.textures).map(function (entry) {
    return '<option value="' + entry[0] + '">' + entry[1] + "</option>";
  }).join("");
};
TPP.loadForm = function () {
  const book = TPP.active;
  if (book) book.signatureSize = TPP.signatureSize(book.signatureSize);
  if (book) book.sewingStations = TPP.sewingStations(book.sewingStations);
  if (book) book.sewingGuideOpacity = TPP.opacity(book.sewingGuideOpacity, 0.65);
  if (book) book.signatureGuideOpacity = TPP.opacity(book.signatureGuideOpacity, 0.65);
  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(book[id]);
    else el.value = book[id] ?? "";
  });
  document.querySelector(".customSize").hidden = document.getElementById("pageSize").value !== "custom";
  TPP.renderChapterList();
  TPP.renderChapterEditor();
};
TPP.sync = function () {
  const book = TPP.active;
  if (!book) return;
  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") book[id] = el.checked;
    else if (el.type === "number" || el.type === "range") book[id] = Number(el.value);
    else book[id] = el.value;
  });
  book.signatureSize = TPP.signatureSize(book.signatureSize);
  book.sewingStations = TPP.sewingStations(book.sewingStations);
  book.sewingGuideOpacity = TPP.opacity(book.sewingGuideOpacity, 0.65);
  book.signatureGuideOpacity = TPP.opacity(book.signatureGuideOpacity, 0.65);
  const signature = document.getElementById("signatureSize");
  if (signature) signature.value = book.signatureSize;
  const sewing = document.getElementById("sewingStations");
  if (sewing) sewing.value = book.sewingStations;
  const sewingOpacity = document.getElementById("sewingGuideOpacity");
  if (sewingOpacity) sewingOpacity.value = book.sewingGuideOpacity;
  const signatureOpacity = document.getElementById("signatureGuideOpacity");
  if (signatureOpacity) signatureOpacity.value = book.signatureGuideOpacity;
  book.chapters = TPP.readChapterFromEditor();
  TPP.save();
};
TPP.readChapterFromEditor = function () {
  const card = document.querySelector(".chapter-card");
  if (!card) return TPP.active.chapters;
  const copy = TPP.active.chapters.map(function (chapter) { return Object.assign({}, chapter); });
  const index = Number(card.dataset.index);
  const chapter = copy[index];
  if (chapter) {
    chapter.title = card.querySelector(".chapter-title").value;
    chapter.text = card.querySelector(".chapter-text").value;
    chapter.imagePlacement = card.querySelector(".chapter-image-placement").value;
    chapter.imageWidth = Number(card.querySelector(".chapter-image-width").value) || 70;
    chapter.level = Number(card.querySelector(".chapter-level").value) || 0;
    chapter.isSubsection = card.querySelector(".chapter-subsection").checked;
    chapter.isMetadata = card.querySelector(".chapter-metadata").checked;
    chapter.includeInToc = card.querySelector(".chapter-toc").checked;
  }
  return copy;
};
TPP.renderChapterList = function () {
  document.getElementById("chapterList").innerHTML = TPP.active.chapters.map(function (chapter, index) {
    return '<div class="chapter-pill ' + (index === TPP.currentChapter ? "active" : "") + '" data-i="' + index + '" style="--level:' + (chapter.level || 0) + '">' +
      '<span class="indent"></span><button class="small" data-act="select">' + (index + 1) + ". " + TPP.esc(chapter.title || "Untitled") + '</button><button class="small" data-act="up">↑</button><button class="small" data-act="down">↓</button><button class="small" data-act="outdent">←</button><button class="small" data-act="indent">→</button></div>';
  }).join("");
};
TPP.previewWithBreaks = function (text) {
  const settings = TPP.active || TPP.fallbackBook();
  const blocks = TPP.blocksFromText(text, settings).map(function (block) { return block.html; }).join("");
  const parts = blocks.split(/<\/p>/);
  return parts.map(function (part, index) {
    return part + (part.includes("<p") ? "</p>" : "") + (index % 2 === 1 ? '<div class="page-break">Page break estimate</div>' : "");
  }).join("");
};
TPP.metadataPreview = function (text) {
  const meta = TPP.parseChapterMetadata({ text: text });
  if (!meta) return '<div class="meta">Invalid metadata JSON</div>';
  if (meta.type === "blank") return '<div class="meta">Blank pages: ' + meta.pages + "</div>";
  return '<div class="meta">Unsupported metadata type</div>';
};
TPP.renderChapterEditor = function () {
  const chapter = TPP.active.chapters[TPP.currentChapter] || TPP.active.chapters[0];
  if (!chapter) {
    document.getElementById("chapterEditor").innerHTML = "";
    return;
  }
  document.getElementById("chapterEditor").innerHTML =
    '<article class="chapter-card" data-index="' + TPP.currentChapter + '">' +
    '<div class="toolbar"><button data-main="remove">Remove</button><button data-main="read">Read From Here</button></div>' +
    '<label>Chapter Title <input class="chapter-title" value="' + TPP.esc(chapter.title) + '"></label>' +
    '<div class="two"><label>Level <input class="chapter-level" type="number" min="0" max="6" value="' + (chapter.level || 0) + '"></label><label><input class="chapter-subsection" type="checkbox" ' + (chapter.isSubsection ? "checked" : "") + "> Sub-section</label></div>" +
    '<label><input class="chapter-metadata" type="checkbox" ' + (chapter.isMetadata ? "checked" : "") + "> Content is metadata JSON</label>" +
    '<label><input class="chapter-toc" type="checkbox" ' + (chapter.includeInToc !== false ? "checked" : "") + "> Appears in table of contents</label>" +
    '<div class="toolbar"><button data-fmt="bold">Bold</button><button data-fmt="italic">Italic</button><button data-fmt="underline">Underline</button><button data-fmt="strike">Strike</button><button data-fmt="ul">Bullets</button><button data-fmt="h2">Heading</button><button data-fmt="table">Table</button></div>' +
    '<div class="editor-grid"><label>' + (chapter.isMetadata ? "Metadata JSON" : "Markdown") + '<textarea class="chapter-text" placeholder="' + (chapter.isMetadata ? '{&quot;type&quot;:&quot;blank&quot;,&quot;pages&quot;:12}' : "") + '">' + TPP.esc(chapter.text || "") + '</textarea></label><div><strong>Preview</strong><div class="md-preview">' + (chapter.isMetadata ? TPP.metadataPreview(chapter.text || "") : TPP.previewWithBreaks(chapter.text || "")) + "</div></div></div>" +
    '<div class="two"><label>Image Placement<select class="chapter-image-placement"><option value="none" ' + (chapter.imagePlacement === "none" ? "selected" : "") + '>No Image</option><option value="below" ' + (chapter.imagePlacement === "below" ? "selected" : "") + '>Below Title</option><option value="own" ' + (chapter.imagePlacement === "own" ? "selected" : "") + '>Own Page</option></select></label><label>Image Width %<input class="chapter-image-width" type="number" min="10" max="100" value="' + (chapter.imageWidth || 70) + '"></label></div>' +
    '<label>Chapter Image<input class="chapter-image" type="file" accept="image/*"></label>' +
    (chapter.imageData ? '<img src="' + chapter.imageData + '" style="max-width:140px;border-radius:10px">' : "") +
    "</article>";
  TPP.renderQr(document.getElementById("chapterEditor"));
};
