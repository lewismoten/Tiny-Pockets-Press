window.TPP = window.TPP || {};
TPP.dataPreviewStore = {};

TPP.dateTime = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};
TPP.timeOnly = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
};
TPP.shortDateTime = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};
TPP.relativeDateTime = function (value) {
  if (!value) return { relative: "", exact: "", label: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { relative: String(value), exact: "", label: String(value) };
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / day);
  let relative = "";
  if (diffMs < 45 * 1000) relative = "just now";
  else if (diffMs < 90 * 1000) relative = "1 minute ago";
  else if (diffMs < 45 * minute) relative = Math.round(diffMs / minute) + " minutes ago";
  else if (diffMs < 90 * minute) relative = "1 hour ago";
  else if (dayDiff === 0 && diffMs < 22 * hour) relative = Math.round(diffMs / hour) + " hours ago";
  else if (dayDiff === 0) relative = "today";
  else if (dayDiff === 1) relative = "yesterday";
  else if (dayDiff < 7) relative = dayDiff + " days ago";
  else if (dayDiff < 14) relative = "1 week ago";
  else if (dayDiff < 31) relative = Math.round(dayDiff / 7) + " weeks ago";
  else if (dayDiff < 45) relative = "1 month ago";
  else if (dayDiff < 365) relative = Math.round(dayDiff / 30) + " months ago";
  else if (dayDiff < 545) relative = "1 year ago";
  else relative = Math.round(dayDiff / 365) + " years ago";
  const exact = dayDiff === 0 ? TPP.timeOnly(value) : TPP.shortDateTime(value);
  return {
    relative: relative,
    exact: exact,
    label: exact ? relative + " · " + exact : relative
  };
};
TPP.bookDimensions = function (book) {
  const size = TPP.sizes[book.pageSize] || { w: book.customW || 1, h: book.customH || 1 };
  return {
    w: Number(size.w) || 1,
    h: Number(size.h) || 1
  };
};
TPP.aboutMetaItem = function (label, value) {
  return '<div class="about-meta-item"><span class="about-meta-label">' + TPP.esc(label) + '</span><span class="about-meta-value">' + TPP.esc(value || "—") + "</span></div>";
};
TPP.bookLatestSource = function (book) {
  const chain = Array.isArray(book && book.provenance) ? book.provenance : [];
  for (let i = chain.length - 1; i >= 0; i--) {
    if (chain[i] && (chain[i].action === "import" || chain[i].action === "copy")) return chain[i];
  }
  return null;
};
TPP.bookText = function (book) {
  return [book.title, book.author, book.publisher].concat((book.chapters || []).flatMap(function (c) {
    return [c.title, c.text];
  })).join(" ").toLowerCase();
};
TPP.dataImageValue = function (book, key, value) {
  if (typeof value === "string" && /^data:image\//.test(value)) return value;
  if (typeof value === "string" && book && TPP.fileAsset(book, value)) {
    const file = TPP.fileAsset(book, value);
    if (file && /^image\//.test(file.type || "")) return file.data;
  }
  if (value && typeof value === "object" && typeof value.data === "string" && /^data:image\//.test(value.data)) return value.data;
  return "";
};
TPP.dataUriParts = function (value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:([^;,]+)?(?:;charset=([^;,]+))?(;base64)?,([\s\S]*)$/i);
  if (!match) return null;
  return {
    mime: match[1] || "application/octet-stream",
    charset: match[2] || "",
    base64: !!match[3],
    payload: match[4] || ""
  };
};
TPP.base64Bytes = function (value) {
  if (typeof value !== "string") return null;
  const clean = value.replace(/\s+/g, "");
  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (_error) {
    return null;
  }
};
TPP.fileBytes = function (value) {
  const uri = TPP.dataUriParts(value);
  if (!uri) return null;
  if (uri.base64) return TPP.base64Bytes(uri.payload);
  try {
    const text = decodeURIComponent(uri.payload.replace(/\+/g, "%20"));
    return new TextEncoder().encode(text);
  } catch (_error) {
    return new TextEncoder().encode(uri.payload);
  }
};
TPP.fileBytesLabel = function (count) {
  const bytes = Number(count) || 0;
  if (bytes === 1) return "1 byte";
  if (bytes < 1024) return bytes + " bytes";
  const kb = bytes / 1024;
  if (kb < 10) return kb.toFixed(1).replace(/\.0$/, "") + " KB";
  if (kb < 1024) return Math.round(kb) + " KB";
  const mb = kb / 1024;
  if (mb < 10) return mb.toFixed(1).replace(/\.0$/, "") + " MB";
  return Math.round(mb) + " MB";
};
TPP.hexLine = function (bytes, offset, width) {
  const slice = Array.from(bytes.slice(offset, offset + width));
  const hex = slice.map(function (value) {
    return value.toString(16).toUpperCase().padStart(2, "0");
  });
  while (hex.length < width) hex.push("  ");
  const ascii = slice.map(function (value) {
    return value >= 32 && value <= 126 ? String.fromCharCode(value) : ".";
  }).join("");
  return "0x" + offset.toString(16).toUpperCase().padStart(4, "0") + "  " + hex.join(" ") + "  " + ascii;
};
TPP.hexDump = function (bytes) {
  if (!bytes || !bytes.length) return "0x0000";
  const width = 16;
  const lines = [];
  for (let i = 0; i < bytes.length; i += width) lines.push(TPP.hexLine(bytes, i, width));
  return lines.join("\n");
};
TPP.dataBinaryInfo = function (book, key, value) {
  let record = null;
  let source = "";
  if (value && typeof value === "object" && typeof value.data === "string") {
    record = value;
    source = value.data;
  } else if (typeof value === "string" && /^data:/i.test(value)) {
    source = value;
  } else {
    return null;
  }
  const uri = TPP.dataUriParts(source);
  if (!uri) return null;
  const bytes = TPP.fileBytes(source) || new Uint8Array();
  const mime = (record && record.type) || uri.mime || "application/octet-stream";
  const name = (record && record.name) || String(key || "data");
  return {
    key: String(key || "data"),
    name: name,
    mime: mime,
    format: uri.base64 ? "base64" : "text",
    raw: source,
    bytes: bytes,
    size: bytes.length,
    friendlySize: TPP.fileBytesLabel(bytes.length),
    exactSize: String(bytes.length) + (bytes.length === 1 ? " byte" : " bytes")
  };
};
TPP.dataImageCell = function (book, key, value) {
  const src = TPP.dataImageValue(book, key, value);
  if (!src) return "";
  return '<button type="button" class="data-image-chip" data-image-src="' + TPP.esc(src) + '" data-image-title="' + TPP.esc(String(key || "Image")) + '"><img src="' + TPP.esc(src) + '" alt="' + TPP.esc(String(key || "Image")) + '"></button>';
};
TPP.dataFileHtml = function (book, key, value) {
  const info = TPP.dataBinaryInfo(book, key, value);
  if (!info) return "";
  const image = TPP.dataImageCell(book, key, value);
  const imagePart = image ? '<span class="data-file-preview">' + image + "</span>" : "";
  const textId = TPP.registerDataPreview(info.name + " (" + info.format + ")", info.raw, "text");
  const hexId = TPP.registerDataPreview(info.name + " (hex)", TPP.hexDump(info.bytes), "hex");
  return '<div class="data-file-value">' +
    imagePart +
    '<div class="data-file-meta">' +
      '<span class="data-file-pill">' + TPP.esc(info.format) + "</span>" +
      '<span class="data-file-pill" title="' + TPP.esc(info.exactSize) + '" data-bytes="' + TPP.esc(info.exactSize) + '">' + TPP.esc(info.friendlySize) + "</span>" +
      '<button type="button" class="data-file-action" data-data-view="' + TPP.esc(textId) + '">View</button>' +
      '<button type="button" class="data-file-action" data-data-hex="' + TPP.esc(hexId) + '">View Hex</button>' +
    "</div>" +
  "</div>";
};
TPP.dataPrimitiveHtml = function (book, key, value) {
  const file = TPP.dataFileHtml(book, key, value);
  if (file) return file;
  const image = TPP.dataImageCell(book, key, value);
  if (image) {
    return '<span class="data-image-link">' + image + '<span class="data-image-meta">' + TPP.esc(typeof value === "string" ? value : "Image") + "</span></span>";
  }
  if (typeof value === "boolean") return '<span class="data-primitive">' + (value ? "true" : "false") + "</span>";
  if (value === null) return '<span class="data-empty">null</span>';
  if (value === "") return '<span class="data-empty">empty</span>';
  return '<span class="data-primitive">' + TPP.esc(String(value)) + "</span>";
};
TPP.dataTableColumns = function (items) {
  const seen = new Set();
  const columns = [];
  (items || []).forEach(function (item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    Object.keys(item).forEach(function (key) {
      if (seen.has(key)) return;
      seen.add(key);
      columns.push(key);
    });
  });
  return columns;
};
TPP.dataValueHtml = function (book, key, value, compact) {
  if (Array.isArray(value)) return TPP.dataArrayHtml(book, key, value, compact);
  if (value && typeof value === "object") return TPP.dataObjectHtml(book, value, compact);
  return TPP.dataPrimitiveHtml(book, key, value);
};
TPP.dataArrayHtml = function (book, key, list, compact) {
  if (!list.length) return '<div class="data-empty">[]</div>';
  const allObjects = list.every(function (item) {
    return item && typeof item === "object" && !Array.isArray(item);
  });
  if (!allObjects) {
    return '<table class="data-table"><thead><tr><th>#</th><th>Value</th></tr></thead><tbody>' + list.map(function (item, index) {
      return "<tr><td>" + (index + 1) + "</td><td>" + TPP.dataValueHtml(book, key, item, true) + "</td></tr>";
    }).join("") + "</tbody></table>";
  }
  const columns = TPP.dataTableColumns(list);
  return '<table class="data-table"><thead><tr><th>#</th>' + columns.map(function (column) {
    return "<th>" + TPP.esc(column) + "</th>";
  }).join("") + "</tr></thead><tbody>" + list.map(function (item, index) {
    return "<tr><td>" + (index + 1) + "</td>" + columns.map(function (column) {
      return "<td>" + TPP.dataValueHtml(book, column, item[column], true) + "</td>";
    }).join("") + "</tr>";
  }).join("") + "</tbody></table>";
};
TPP.dataObjectHtml = function (book, obj, compact) {
  const entries = Object.entries(obj || {});
  if (!entries.length) return '<div class="data-empty">{}</div>';
  return '<div class="' + (compact ? "data-inline-object" : "data-object") + '">' + entries.map(function (entry) {
    return '<div class="data-field"><div class="data-field-name">' + TPP.esc(entry[0]) + '</div><div class="data-field-value">' + TPP.dataValueHtml(book, entry[0], entry[1], compact) + "</div></div>";
  }).join("") + "</div>";
};
TPP.renderData = function () {
  if (!TPP.active) return;
  TPP.sync("nosave");
  const summary = document.getElementById("dataSummary");
  const panel = document.getElementById("dataPanel");
  if (!summary || !panel) return;
  const book = TPP.clone(TPP.active);
  TPP.dataPreviewStore = {};
  summary.innerHTML = "Structured view of the current book JSON. Arrays render as tables, nested objects stay expanded, and image/file values can be previewed.";
  panel.innerHTML = '<article class="data-card"><div class="data-node">' + TPP.dataObjectHtml(book, book, false) + "</div></article>";
};
TPP.registerDataPreview = function (title, body, mode) {
  const id = "preview-" + TPP.uid();
  TPP.dataPreviewStore[id] = { title: title || "Data Preview", body: body || "", mode: mode || "text" };
  return id;
};
TPP.openDataImagePreview = function (src, title) {
  const dialog = document.getElementById("dataImageDialog");
  const image = document.getElementById("dataImagePreview");
  const heading = document.getElementById("dataImageTitle");
  if (!dialog || !image || !heading || typeof dialog.showModal !== "function") return;
  image.src = src || "";
  heading.textContent = title || "Image Preview";
  if (!dialog.open) dialog.showModal();
};
TPP.openDataTextPreview = function (title, body, mode) {
  const dialog = document.getElementById("dataTextDialog");
  const heading = document.getElementById("dataTextTitle");
  const pre = document.getElementById("dataTextBody");
  if (!dialog || !heading || !pre || typeof dialog.showModal !== "function") return;
  heading.textContent = title || "Data Preview";
  pre.textContent = body || "";
  pre.className = mode === "hex" ? "data-code data-code-hex" : "data-code";
  if (!dialog.open) dialog.showModal();
};
TPP.openDataPreviewById = function (id) {
  const entry = TPP.dataPreviewStore && TPP.dataPreviewStore[id];
  if (!entry) return;
  TPP.openDataTextPreview(entry.title, entry.body, entry.mode);
};
TPP.renderLibrary = function () {
  const q = (document.getElementById("librarySearch")?.value || "").toLowerCase();
  const books = TPP.library.filter(function (book) {
    return !q || TPP.bookText(book).includes(q);
  });
  document.getElementById("libraryGrid").innerHTML = books.map(function (book) {
    const size = TPP.sizes[book.pageSize] || { w: book.customW || 1, h: book.customH || 1 };
    const pages = book._pageCount || "—";
    const modified = TPP.relativeDateTime(book.updatedAt);
    return '<article class="library-card ' + (TPP.active && TPP.active.id === book.id ? "active" : "") + '" data-id="' + book.id + '">' +
      '<div class="library-cover" style="' + (book.coverPreview ? "background-image:url(" + book.coverPreview + ")" : "background:linear-gradient(to bottom," + book.coverBg1 + "," + book.coverBg2 + ")") + '"></div>' +
      '<div class="library-card-body"><h3>' + TPP.esc(book.title) + "</h3><p>" + TPP.esc(book.author) + "</p><p>" + pages + " pages · " + Number(size.w).toFixed(2) + "×" + Number(size.h).toFixed(2) + ' in</p><p class="library-meta">Modified ' + TPP.esc(modified.label || "—") + '</p><div class="toolbar"><button data-act="edit">Edit</button><button data-act="about">About</button><button data-act="view">View</button><button data-act="dup">Duplicate</button><button data-act="export">Export</button></div></div></article>';
  }).join("");
};
TPP.renderAbout = function () {
  if (!TPP.active) return;
  const book = TPP.active;
  const pages = TPP.buildPages();
  const settings = TPP.settings();
  const front = pages.find(function (page) { return page.role === "front"; }) || pages[0];
  const size = TPP.bookDimensions(book);
  const latest = TPP.bookLatestSource(book);
  const latestRevisionLabel = latest ? (String(latest.sourceRevision || 1) + "." + String(latest.sourceSubrevision || 0)) : "";
  const original = latest ? TPP.library.find(function (candidate) { return candidate.id === latest.sourceId; }) : null;
  const summary = document.getElementById("aboutSummary");
  const panel = document.getElementById("aboutPanel");
  if (!summary || !panel) return;
  const revisionLabel = String(book.revision || 1) + "." + String(book.subrevision || 0);
  summary.innerHTML = "<strong>Revision " + TPP.esc(revisionLabel) + "</strong>. " +
    TPP.esc(String(pages.length)) + " pages at " + TPP.esc(size.w.toFixed(2) + " × " + size.h.toFixed(2)) + " in. " +
    (latest ? ("Latest source: " + TPP.esc((latest.action === "import" ? "Imported" : "Copied") + " from revision " + latestRevisionLabel + ".")) : "No copy/import provenance recorded.");
  panel.innerHTML =
    '<div>' +
      '<article class="about-card">' +
        '<h3>Cover</h3>' +
        '<div class="about-cover-shell"><div id="aboutCoverMount"></div></div>' +
        '<p class="about-note">ID: ' + TPP.esc(book.id) + "</p>" +
      "</article>" +
    "</div>" +
    '<div>' +
      '<article class="about-meta">' +
        '<h3>Metadata</h3>' +
        '<div class="about-meta-grid">' +
          [
            TPP.aboutMetaItem("Title", book.title),
            TPP.aboutMetaItem("Author", book.author),
            TPP.aboutMetaItem("Author Spine Name", book.spineAuthor),
            TPP.aboutMetaItem("Publishing Date", TPP.date(book.pubDate)),
            TPP.aboutMetaItem("Publisher", book.publisher),
            TPP.aboutMetaItem("Copyright", book.copyright),
            TPP.aboutMetaItem("Series", book.seriesName),
            TPP.aboutMetaItem("Number", book.number),
            TPP.aboutMetaItem("Volume", book.volume),
            TPP.aboutMetaItem("Printing", book.printing),
            TPP.aboutMetaItem("Include TOC", book.includeToc ? "Yes" : "No"),
            TPP.aboutMetaItem("Pages", String(pages.length)),
            TPP.aboutMetaItem("Dimensions", size.w.toFixed(2) + " × " + size.h.toFixed(2) + " in"),
            TPP.aboutMetaItem("Book ID", book.id),
            TPP.aboutMetaItem("Revision", String(book.revision || 1)),
            TPP.aboutMetaItem("Subrevision", String(book.subrevision || 0)),
            TPP.aboutMetaItem("Created", TPP.dateTime(book.createdAt)),
            TPP.aboutMetaItem("Last Edited", TPP.dateTime(book.updatedAt)),
            TPP.aboutMetaItem("Last Imported", TPP.dateTime(book.lastImportedAt)),
            TPP.aboutMetaItem("Last Exported", TPP.dateTime(book.lastExportedAt))
          ].join("") +
        "</div>" +
      "</article>" +
      '<article class="about-provenance">' +
        '<h3>Latest Copy / Import</h3>' +
        (latest
          ? (
            '<div class="about-meta-grid">' +
              TPP.aboutMetaItem("Action", latest.action === "import" ? "Imported" : "Copied") +
              TPP.aboutMetaItem("Original ID", latest.sourceId) +
              TPP.aboutMetaItem("Original Title", latest.sourceTitle) +
              TPP.aboutMetaItem("Original Revision", String(latest.sourceRevision || 1)) +
              TPP.aboutMetaItem("Original Subrevision", String(latest.sourceSubrevision || 0)) +
              TPP.aboutMetaItem("Original Updated", TPP.dateTime(latest.sourceUpdatedAt)) +
              TPP.aboutMetaItem("Recorded", TPP.dateTime(latest.recordedAt)) +
            "</div>" +
            (original
              ? '<button type="button" id="aboutOpenOriginal" class="about-link">Open Original Book</button>'
              : '<p class="about-note">Original book is not currently in this library.</p>')
          )
          : '<p class="about-note">This book does not have any copy/import provenance yet.</p>') +
      "</article>" +
    "</div>";
  const originalButton = document.getElementById("aboutOpenOriginal");
  if (originalButton && original) {
    originalButton.onclick = function () {
      TPP.setActive(original);
      TPP.switchView("about");
    };
  }
  const coverMount = document.getElementById("aboutCoverMount");
  if (coverMount && front) {
    coverMount.innerHTML = "";
    const coverEl = TPP.pageEl(front, settings, 0, 0, false, true, { w: settings.page.w, h: settings.page.h });
    coverEl.style.position = "relative";
    coverEl.style.left = "auto";
    coverEl.style.top = "auto";
    coverEl.style.boxShadow = "0 18px 35px rgb(0 0 0 / .18)";
    coverEl.style.borderRadius = ".18in";
    coverMount.appendChild(coverEl);
  }
};
TPP.captureCover = async function () {
  try {
    const settings = TPP.settings();
    const page = TPP.buildPages()[0];
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:" + settings.page.w + "in;height:" + settings.page.h + "in";
    wrap.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    document.body.appendChild(wrap);
    const canvas = await html2canvas(wrap, { scale: 4, backgroundColor: null });
    TPP.active.coverPreview = canvas.toDataURL("image/jpeg", 0.9);
    TPP.active._pageCount = TPP.lastPages.length;
    wrap.remove();
    TPP.save();
  } catch (error) {
    console.warn(error);
  }
};
