window.TPP = window.TPP || {};
TPP.dataPreviewStore = {};
TPP.dataStaleStore = {};

TPP.dateTime = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
TPP.timeOnly = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
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
    minute: "2-digit",
  });
};
TPP.relativeDateTime = function (value) {
  if (!value) return { relative: "", exact: "", label: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return { relative: String(value), exact: "", label: String(value) };
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / day,
  );
  let relative = "";
  if (diffMs < 45 * 1000) relative = "just now";
  else if (diffMs < 90 * 1000) relative = "1 minute ago";
  else if (diffMs < 45 * minute)
    relative = Math.round(diffMs / minute) + " minutes ago";
  else if (diffMs < 90 * minute) relative = "1 hour ago";
  else if (dayDiff === 0 && diffMs < 22 * hour)
    relative = Math.round(diffMs / hour) + " hours ago";
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
    label: exact ? relative + " · " + exact : relative,
  };
};
TPP.bookDimensions = function (book) {
  const size = TPP.sizes[book.pageSize] || {
    w: book.customW || 1,
    h: book.customH || 1,
  };
  return {
    w: Number(size.w) || 1,
    h: Number(size.h) || 1,
  };
};
TPP.aboutMetaItem = function (label, value) {
  return (
    '<div class="about-meta-item"><span class="about-meta-label">' +
    TPP.esc(label) +
    '</span><span class="about-meta-value">' +
    TPP.esc(value || "—") +
    "</span></div>"
  );
};
TPP.bookLatestSource = function (book) {
  const chain = TPP.bookProvenance(book);
  for (let i = chain.length - 1; i >= 0; i--) {
    if (
      chain[i] &&
      (chain[i].action === "import" || chain[i].action === "copy")
    )
      return chain[i];
  }
  return null;
};
TPP.bookText = function (book) {
  return [book.title, book.author, book.publisher]
    .concat(
      (book.chapters || []).flatMap(function (c) {
        return [c.title, c.text];
      }),
    )
    .join(" ")
    .toLowerCase();
};
TPP.isoDateInfo = function (value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      text,
    )
  )
    return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  const relative = TPP.relativeDateTime(text);
  return {
    raw: text,
    local: TPP.dateTime(text),
    relative: relative.relative || "",
    label: relative.label || "",
  };
};
TPP.dataImageValue = function (book, key, value) {
  if (typeof value === "string" && /^data:image\//.test(value)) return value;
  if (
    typeof value === "string" &&
    /imageElementId$/i.test(String(key || "")) &&
    Array.isArray(book && book.imageElements)
  ) {
    const element = book.imageElements.find(function (entry) {
      return entry && entry.id === value;
    });
    if (element && element.fileId) {
      const file = TPP.fileAsset(book, element.fileId);
      if (file && /^image\//.test(file.type || "")) return file.data;
    }
  }
  if (typeof value === "string" && book && TPP.fileAsset(book, value)) {
    const file = TPP.fileAsset(book, value);
    if (file && /^image\//.test(file.type || "")) return file.data;
  }
  if (
    value &&
    typeof value === "object" &&
    typeof value.data === "string" &&
    /^data:image\//.test(value.data)
  )
    return value.data;
  return "";
};
TPP.dataUriParts = function (value) {
  if (typeof value !== "string") return null;
  const match = value.match(
    /^data:([^;,]+)?(?:;charset=([^;,]+))?(;base64)?,([\s\S]*)$/i,
  );
  if (!match) return null;
  return {
    mime: match[1] || "application/octet-stream",
    charset: match[2] || "",
    base64: !!match[3],
    payload: match[4] || "",
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
  const ascii = slice
    .map(function (value) {
      return value >= 32 && value <= 126 ? String.fromCharCode(value) : ".";
    })
    .join("");
  return (
    "0x" +
    offset.toString(16).toUpperCase().padStart(4, "0") +
    "  " +
    hex.join(" ") +
    "  " +
    ascii
  );
};
TPP.hexDump = function (bytes) {
  if (!bytes || !bytes.length) return "0x0000";
  const width = 16;
  const lines = [];
  for (let i = 0; i < bytes.length; i += width)
    lines.push(TPP.hexLine(bytes, i, width));
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
  const mime =
    (record && record.type) || uri.mime || "application/octet-stream";
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
    exactSize: String(bytes.length) + (bytes.length === 1 ? " byte" : " bytes"),
  };
};
TPP.dataImageCell = function (book, key, value) {
  const src = TPP.dataImageValue(book, key, value);
  if (!src) return "";
  return (
    '<button type="button" class="data-image-chip" data-image-src="' +
    TPP.esc(src) +
    '" data-image-title="' +
    TPP.esc(String(key || "Image")) +
    '"><img src="' +
    TPP.esc(src) +
    '" alt="' +
    TPP.esc(String(key || "Image")) +
    '"></button>'
  );
};
TPP.dataFileHtml = function (book, key, value) {
  const info = TPP.dataBinaryInfo(book, key, value);
  if (!info) return "";
  const textId = TPP.registerDataPreview(
    info.name + " (" + info.format + ")",
    info.raw,
    "text",
  );
  const hexId = TPP.registerDataPreview(
    info.name + " (hex)",
    TPP.hexDump(info.bytes),
    "hex",
  );
  return (
    '<div class="data-file-value">' +
    '<div class="data-file-meta">' +
    '<button type="button" class="data-file-action" data-data-view="' +
    TPP.esc(textId) +
    '">View</button>' +
    '<button type="button" class="data-file-action" data-data-hex="' +
    TPP.esc(hexId) +
    '">View Hex</button>' +
    "</div>" +
    "</div>"
  );
};
TPP.dataFileArray = function (list) {
  return (
    Array.isArray(list) &&
    list.every(function (item) {
      return (
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof item.data === "string"
      );
    })
  );
};
TPP.dataFilesTable = function (book, list) {
  return (
    '<table class="data-table"><thead><tr><th>#</th><th>Preview</th><th>Name</th><th>Type</th><th>Encoding</th><th>Size</th><th>ID</th><th>Hash</th><th>Data</th></tr></thead><tbody>' +
    list
      .map(function (item, index) {
        const info = TPP.dataBinaryInfo(
          book,
          item.name || item.id || "file-" + (index + 1),
          item,
        ) || {
          format: "unknown",
          friendlySize: "0 bytes",
          exactSize: "0 bytes",
        };
        const preview =
          TPP.dataImageCell(book, item.name || item.id || "Image", item) ||
          '<span class="data-empty">—</span>';
        return (
          "<tr><td>" +
          (index + 1) +
          "</td>" +
          "<td>" +
          preview +
          "</td>" +
          "<td>" +
          (item.name
            ? TPP.esc(item.name)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          (item.type
            ? TPP.esc(item.type)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          '<td><span class="data-file-pill">' +
          TPP.esc(info.format) +
          "</span></td>" +
          '<td><span class="data-file-pill" title="' +
          TPP.esc(info.exactSize) +
          '" data-bytes="' +
          TPP.esc(info.exactSize) +
          '">' +
          TPP.esc(info.friendlySize) +
          "</span></td>" +
          "<td>" +
          (item.id ? TPP.esc(item.id) : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          (item.hash
            ? TPP.esc(item.hash)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          TPP.dataFileHtml(book, item.name || item.id || "data", item) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table>"
  );
};
TPP.dataImageElementsTable = function (book, list) {
  return (
    '<table class="data-table"><thead><tr><th>#</th><th>Preview</th><th>ID</th><th>Location</th><th>Part</th><th>File ID</th><th>X</th><th>Y</th><th>Zoom</th><th>Rotate</th><th>Placement</th></tr></thead><tbody>' +
    list
      .map(function (item, index) {
        const preview =
          TPP.dataImageCell(
            book,
            item.fileId || item.id || "Image",
            item.fileId,
          ) || '<span class="data-empty">—</span>';
        return (
          "<tr><td>" +
          (index + 1) +
          "</td>" +
          "<td>" +
          preview +
          "</td>" +
          "<td>" +
          (item.id ? TPP.esc(item.id) : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          (item.location
            ? TPP.esc(item.location)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          (item.part
            ? TPP.esc(item.part)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          (item.fileId
            ? TPP.esc(item.fileId)
            : '<span class="data-empty">—</span>') +
          "</td>" +
          "<td>" +
          TPP.dataValueHtml(book, "x", item.x, true) +
          "</td>" +
          "<td>" +
          TPP.dataValueHtml(book, "y", item.y, true) +
          "</td>" +
          "<td>" +
          TPP.dataValueHtml(book, "zoom", item.zoom, true) +
          "</td>" +
          "<td>" +
          TPP.dataValueHtml(book, "rotate", item.rotate, true) +
          "</td>" +
          "<td>" +
          TPP.dataValueHtml(book, "placement", item.placement, true) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table>"
  );
};
TPP.dataPrimitiveHtml = function (book, key, value) {
  const file = TPP.dataFileHtml(book, key, value);
  if (file) return file;
  const image = TPP.dataImageCell(book, key, value);
  if (image) {
    return (
      '<span class="data-image-link">' +
      image +
      '<span class="data-image-meta">' +
      TPP.esc(typeof value === "string" ? value : "Image") +
      "</span></span>"
    );
  }
  if (typeof value === "boolean")
    return (
      '<span class="data-primitive">' + (value ? "true" : "false") + "</span>"
    );
  if (value === null) return '<span class="data-empty">null</span>';
  if (value === "") return '<span class="data-empty">empty</span>';
  const color = TPP.dataColorValue(value);
  if (color) {
    return (
      '<span class="data-color-value">' +
      '<span class="data-color-swatch" style="background:' +
      TPP.esc(color) +
      ';"></span>' +
      '<span class="data-primitive">' +
      TPP.esc(String(value)) +
      "</span></span>"
    );
  }
  const iso = TPP.isoDateInfo(value);
  if (iso) {
    return (
      '<span class="data-primitive">' +
      TPP.esc(iso.raw) +
      '</span><div class="data-date-meta"><div>Local: ' +
      TPP.esc(iso.local) +
      "</div><div>Time ago: " +
      TPP.esc(iso.relative || "—") +
      "</div></div>"
    );
  }
  return '<span class="data-primitive">' + TPP.esc(String(value)) + "</span>";
};
TPP.dataColorValue = function (value) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  if (
    /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text) ||
    /^(rgb|hsl)a?\(/i.test(text)
  ) {
    return text;
  }
  if (typeof document === "undefined") return "";
  const probe = document.createElement("span");
  probe.style.color = "";
  probe.style.color = text;
  return probe.style.color ? text : "";
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
TPP.dataSchemaKeys = function (context) {
  if (context === "root") {
    const keys = new Set(Object.keys(TPP.fallbackBook()));
    (TPP.COVER_LEGACY_FIELDS || []).forEach(function (field) {
      keys.delete(field);
    });
    return keys;
  }
  if (context === "meta")
    return new Set([
      "id",
      "revision",
      "subrevision",
      "provenance",
      "createdAt",
      "updatedAt",
      "lastExportedAt",
      "lastImportedAt",
      "coverPreviewImageId",
      "pageCount",
    ]);
  if (context === "page")
    return new Set([
      "pageSize",
      "sheetSize",
      "customW",
      "customH",
      "margin",
      "gutterMargin",
      "paperPreset",
      "texture",
      "pageBg",
    ]);
  if (context === "printing") return new Set(["signatureSize"]);
  if (context === "text")
    return new Set([
      "fontFamily",
      "pageText",
      "bodySize",
      "captionSize",
      "lineHeight",
      "paraGap",
      "justify",
    ]);
  if (context === "coverFront")
    return new Set([
      "imageElementId",
      "overflowImage",
      "clipImageToFrame",
      "bg1",
      "bg2",
      "border",
      "borderOn",
    ]);
  if (context === "backCover")
    return new Set([
      "imageElementId",
      "textLastLine",
      "frameOn",
      "clipImageToFrame",
    ]);
  if (context === "spine") return new Set(["imageElementId"]);
  if (context === "bookInfo")
    return new Set([
      "title",
      "author",
      "pubDate",
      "publisher",
      "copyright",
      "seriesName",
      "number",
      "volume",
      "printing",
    ]);
  if (context === "toc")
    return new Set([
      "enabled",
      "numberMode",
      "leaderStyle",
      "leaderColor",
      "indentStep",
    ]);
  if (context === "chapters")
    return new Set([
      "id",
      "title",
      "text",
      "imageId",
      "imageElementId",
      "imagePlacement",
      "imageZoom",
      "imageWidth",
      "imageRotate",
      "level",
      "isSubsection",
      "isMetadata",
      "includeInToc",
      "tocTitle",
    ]);
  if (context === "files")
    return new Set([
      "id",
      "type",
      "name",
      "data",
      "hash",
      "role",
      "hiddenFromPicker",
    ]);
  if (context === "textElements")
    return new Set([
      "id",
      "location",
      "part",
      "enabled",
      "size",
      "x",
      "y",
      "width",
      "align",
      "color",
      "outlineColor",
      "outlineSize",
      "rotate",
      "customText",
    ]);
  if (context === "imageElements")
    return new Set([
      "id",
      "location",
      "part",
      "fileId",
      "x",
      "y",
      "zoom",
      "rotate",
      "placement",
    ]);
  if (context === "provenance")
    return new Set([
      "action",
      "sourceId",
      "sourceTitle",
      "sourceRevision",
      "sourceSubrevision",
      "sourceUpdatedAt",
      "sourceCreatedAt",
      "recordedAt",
    ]);
  return null;
};
TPP.dataSchemaStatus = function (context, key) {
  if (context === "root" && key === "coverPreview") return "deprecated";
  if (context === "chapters" && key === "imageWidth") return "deprecated";
  const known = TPP.dataSchemaKeys(context);
  if (!known) return "active";
  return known.has(key) ? "active" : "unknown";
};
TPP.dataPathLabel = function (path) {
  return (path || [])
    .map(function (segment, index) {
      if (typeof segment === "number") return "[" + segment + "]";
      return index === 0 ? String(segment) : "." + String(segment);
    })
    .join("");
};
TPP.dataPathPattern = function (path) {
  return (path || [])
    .map(function (segment, index) {
      if (typeof segment === "number") return "[]";
      return index === 0 ? String(segment) : "." + String(segment);
    })
    .join("");
};
TPP.dataPathIndices = function (path) {
  return (path || []).filter(function (segment) {
    return typeof segment === "number";
  });
};
TPP.dataResolvePatternPath = function (pattern, indices) {
  const parts = String(pattern || "").split(".");
  let cursor = 0;
  return parts.reduce(function (path, part) {
    if (part.endsWith("[]")) {
      path.push(part.slice(0, -2));
      path.push((indices || [])[cursor] ?? 0);
      cursor += 1;
      return path;
    }
    if (part === "[]") {
      path.push((indices || [])[cursor] ?? 0);
      cursor += 1;
      return path;
    }
    path.push(part);
    return path;
  }, []);
};
TPP.dataReadPath = function (root, path) {
  let value = root;
  for (let i = 0; i < (path || []).length; i++) {
    if (value == null) return undefined;
    value = value[path[i]];
  }
  return value;
};
TPP.dataValueLabel = function (value) {
  if (value === undefined) return "missing";
  if (value === null) return "null";
  if (typeof value === "string" && value === "") return "empty";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
TPP.dataLookupEntry = function (path) {
  const pattern = TPP.dataPathPattern(path);
  return (
    (Array.isArray(TPP.staleKeyLookup) ? TPP.staleKeyLookup : []).find(
      function (entry) {
        return entry && entry.path === pattern;
      },
    ) || null
  );
};
TPP.dataStaleMeta = function (book, entry) {
  const lookup = TPP.dataLookupEntry(entry.path);
  if (!lookup) return null;
  const indices = TPP.dataPathIndices(entry.path);
  const oldValue = TPP.dataReadPath(book, entry.path);
  const moved = (Array.isArray(lookup.movedTo) ? lookup.movedTo : []).map(
    function (pattern) {
      const resolvedPath = TPP.dataResolvePatternPath(pattern, indices);
      const value = TPP.dataReadPath(book, resolvedPath);
      const matches = JSON.stringify(value) === JSON.stringify(oldValue);
      return {
        pattern: pattern,
        label: TPP.dataPathLabel(resolvedPath),
        value: value,
        valueLabel: TPP.dataValueLabel(value),
        matches: matches,
      };
    },
  );
  return {
    schemaVersion: lookup.schemaVersion,
    note: lookup.note || "",
    moved: moved,
    oldValue: oldValue,
    oldValueLabel: TPP.dataValueLabel(oldValue),
  };
};
TPP.collectDataStaleEntries = function (value, context, path, out) {
  const entries = out || [];
  const currentPath = Array.isArray(path) ? path : [];
  if (Array.isArray(value)) {
    value.forEach(function (item, index) {
      if (item && typeof item === "object")
        TPP.collectDataStaleEntries(
          item,
          context,
          currentPath.concat(index),
          entries,
        );
    });
    return entries;
  }
  if (!value || typeof value !== "object") return entries;
  Object.entries(value).forEach(function (entry) {
    const key = entry[0];
    const child = entry[1];
    if (
      context === "root" &&
      key === "coverPreview" &&
      value.meta &&
      value.meta.coverPreviewImageId
    )
      return;
    const status = TPP.dataSchemaStatus(context, key);
    if (status !== "active") {
      const entryPath = currentPath.concat(key);
      entries.push({
        path: entryPath,
        label: TPP.dataPathLabel(entryPath),
        pattern: TPP.dataPathPattern(entryPath),
        key: key,
        status: status,
      });
    }
    if (Array.isArray(child)) {
      TPP.collectDataStaleEntries(child, key, currentPath.concat(key), entries);
    } else if (child && typeof child === "object") {
      TPP.collectDataStaleEntries(child, key, currentPath.concat(key), entries);
    }
  });
  return entries;
};
TPP.registerStaleEntry = function (entry) {
  const id = "stale-" + TPP.uid();
  TPP.dataStaleStore[id] = entry;
  return id;
};
TPP.dataStaleReportHtml = function (entries) {
  if (!entries.length)
    return '<div class="data-stale-empty">No stale keys detected.</div>';
  return (
    '<section class="data-stale-section">' +
    '<div class="data-stale-toolbar"><button type="button" class="primary alt" data-stale-remove-all="1">Remove All Stale Keys</button></div>' +
    '<div class="data-stale-list">' +
    entries
      .map(function (entry) {
        const id = TPP.registerStaleEntry(entry);
        const tone = entry.status === "deprecated" ? "deprecated" : "unknown";
        const label =
          entry.status === "deprecated" ? "No longer used" : "Not recognized";
        const meta = TPP.dataStaleMeta(TPP.active, entry);
        const details = meta
          ? '<div class="data-stale-details">' +
            "<div><strong>Changed in schema:</strong> v" +
            TPP.esc(String(meta.schemaVersion)) +
            "</div>" +
            (meta.note
              ? "<div><strong>Note:</strong> " + TPP.esc(meta.note) + "</div>"
              : "") +
            "<div><strong>Old value:</strong> " +
            TPP.esc(meta.oldValueLabel) +
            "</div>" +
            (meta.moved.length
              ? meta.moved
                  .map(function (target) {
                    return (
                      "<div><strong>Moved to:</strong> " +
                      TPP.esc(target.label) +
                      " = " +
                      TPP.esc(target.valueLabel) +
                      " (" +
                      (target.matches
                        ? "matches old value"
                        : "differs from old value") +
                      ")</div>"
                    );
                  })
                  .join("")
              : "") +
            "</div>"
          : "";
        return (
          '<article class="data-stale-item ' +
          tone +
          '">' +
          '<div><div class="data-stale-path">' +
          TPP.esc(entry.label) +
          '</div><div class="data-stale-status">' +
          TPP.esc(label) +
          "</div>" +
          details +
          "</div>" +
          '<button type="button" class="small" data-stale-remove="' +
          TPP.esc(id) +
          '">Remove</button>' +
          "</article>"
        );
      })
      .join("") +
    "</div></section>"
  );
};
TPP.dataKeyLabelHtml = function (context, key) {
  const status = TPP.dataSchemaStatus(context, key);
  const display = TPP.dataDisplayKey(key);
  const classes = ["data-key-label"];
  let title = "";
  if (status === "deprecated") {
    classes.push("deprecated");
    title = "No longer used by the application";
  } else if (status === "unknown") {
    classes.push("unknown");
    title = "Not recognized by the current application schema";
  }
  return (
    '<span class="' +
    classes.join(" ") +
    '"' +
    (title ? ' title="' + TPP.esc(title) + '"' : "") +
    ">" +
    TPP.esc(display) +
    "</span>"
  );
};
TPP.dataDisplayKey = function (key) {
  if (key === "coverPreviewId") return "coverPreviewImageId";
  return key;
};
TPP.dataValueHtml = function (book, key, value, compact) {
  if (Array.isArray(value)) return TPP.dataArrayHtml(book, key, value, compact);
  if (value && typeof value === "object")
    return TPP.dataObjectHtml(
      book,
      value,
      compact,
      key === "__root__"
        ? "root"
        : key === "meta"
          ? "meta"
          : key === "page"
            ? "page"
            : key === "text"
              ? "text"
              : key === "coverFront"
                ? "coverFront"
                : key === "backCover"
                  ? "backCover"
                  : key === "spine"
                    ? "spine"
                    : key === "bookInfo"
                      ? "bookInfo"
                      : key === "toc"
                        ? "toc"
                        : null,
    );
  return TPP.dataPrimitiveHtml(book, key, value);
};
TPP.dataArrayHtml = function (book, key, list, compact) {
  if (!list.length) return '<div class="data-empty">[]</div>';
  if (TPP.dataFileArray(list)) return TPP.dataFilesTable(book, list);
  if (String(key || "") === "imageElements")
    return TPP.dataImageElementsTable(book, list);
  const context = String(key || "");
  const allObjects = list.every(function (item) {
    return item && typeof item === "object" && !Array.isArray(item);
  });
  if (!allObjects) {
    return (
      '<table class="data-table"><thead><tr><th>#</th><th>Value</th></tr></thead><tbody>' +
      list
        .map(function (item, index) {
          return (
            "<tr><td>" +
            (index + 1) +
            "</td><td>" +
            TPP.dataValueHtml(book, key, item, true) +
            "</td></tr>"
          );
        })
        .join("") +
      "</tbody></table>"
    );
  }
  const columns = TPP.dataTableColumns(list);
  return (
    '<table class="data-table"><thead><tr><th>#</th>' +
    columns
      .map(function (column) {
        return "<th>" + TPP.dataKeyLabelHtml(context, column) + "</th>";
      })
      .join("") +
    "</tr></thead><tbody>" +
    list
      .map(function (item, index) {
        return (
          "<tr><td>" +
          (index + 1) +
          "</td>" +
          columns
            .map(function (column) {
              return (
                "<td>" +
                TPP.dataValueHtml(book, column, item[column], true) +
                "</td>"
              );
            })
            .join("") +
          "</tr>"
        );
      })
      .join("") +
    "</tbody></table>"
  );
};
TPP.dataObjectHtml = function (book, obj, compact, context) {
  const entries = Object.entries(obj || {}).filter(function (entry) {
    return !(
      entry[0] === "coverPreview" &&
      obj &&
      obj.meta &&
      obj.meta.coverPreviewImageId
    );
  });
  if (!entries.length) return '<div class="data-empty">{}</div>';
  return (
    '<div class="' +
    (compact ? "data-inline-object" : "data-object") +
    '">' +
    entries
      .map(function (entry) {
        return (
          '<div class="data-field"><div class="data-field-name">' +
          TPP.dataKeyLabelHtml(context || "root", entry[0]) +
          '</div><div class="data-field-value">' +
          TPP.dataValueHtml(book, entry[0], entry[1], compact) +
          "</div></div>"
        );
      })
      .join("") +
    "</div>"
  );
};
TPP.dataJsonTokenHtml = function (type, text) {
  return '<span class="json-token ' + type + '">' + TPP.esc(text) + "</span>";
};
TPP.dataJsonPrimitiveHtml = function (value) {
  if (value === null) return TPP.dataJsonTokenHtml("null", "null");
  if (typeof value === "string")
    return TPP.dataJsonTokenHtml("string", JSON.stringify(value));
  if (typeof value === "number")
    return TPP.dataJsonTokenHtml("number", String(value));
  if (typeof value === "boolean")
    return TPP.dataJsonTokenHtml("boolean", String(value));
  return TPP.dataJsonTokenHtml("string", JSON.stringify(String(value)));
};
TPP.dataJsonTreeHtml = function (value, depth, label) {
  const level = Number(depth) || 0;
  if (Array.isArray(value)) {
    if (!value.length)
      return (
        '<div class="json-line" style="--json-depth:' +
        level +
        '"><span class="json-indent"></span>' +
        (label
          ? TPP.dataJsonTokenHtml("key", JSON.stringify(label)) +
            '<span class="json-punct">: </span>'
          : "") +
        '<span class="json-punct">[]</span></div>'
      );
    return (
      '<details class="json-node" style="--json-depth:' +
      level +
      '"' +
      (level < 1 ? " open" : "") +
      ">" +
      '<summary><span class="json-indent"></span>' +
      (label
        ? TPP.dataJsonTokenHtml("key", JSON.stringify(label)) +
          '<span class="json-punct">: </span>'
        : "") +
      '<span class="json-punct">[</span><span class="json-meta">' +
      value.length +
      ' items</span><span class="json-punct">]</span></summary>' +
      '<div class="json-children">' +
      value
        .map(function (entry, index) {
          return TPP.dataJsonTreeHtml(entry, level + 1, String(index));
        })
        .join("") +
      "</div></details>"
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length)
      return (
        '<div class="json-line" style="--json-depth:' +
        level +
        '"><span class="json-indent"></span>' +
        (label
          ? TPP.dataJsonTokenHtml("key", JSON.stringify(label)) +
            '<span class="json-punct">: </span>'
          : "") +
        '<span class="json-punct">{}</span></div>'
      );
    return (
      '<details class="json-node" style="--json-depth:' +
      level +
      '"' +
      (level < 1 ? " open" : "") +
      ">" +
      '<summary><span class="json-indent"></span>' +
      (label
        ? TPP.dataJsonTokenHtml("key", JSON.stringify(label)) +
          '<span class="json-punct">: </span>'
        : "") +
      '<span class="json-punct">{</span><span class="json-meta">' +
      entries.length +
      ' keys</span><span class="json-punct">}</span></summary>' +
      '<div class="json-children">' +
      entries
        .map(function (entry) {
          return TPP.dataJsonTreeHtml(entry[1], level + 1, entry[0]);
        })
        .join("") +
      "</div></details>"
    );
  }
  return (
    '<div class="json-line" style="--json-depth:' +
    level +
    '"><span class="json-indent"></span>' +
    (label
      ? TPP.dataJsonTokenHtml("key", JSON.stringify(label)) +
        '<span class="json-punct">: </span>'
      : "") +
    TPP.dataJsonPrimitiveHtml(value) +
    "</div>"
  );
};
TPP.dataRawJsonHtml = function (book) {
  return (
    '<article class="data-card">' +
    '<div class="data-raw-toolbar"><button type="button" class="primary alt" data-copy-json="1">Copy JSON</button></div>' +
    '<details class="data-raw-details" open>' +
    "<summary>Raw JSON</summary>" +
    '<div class="data-code data-code-json">' +
    TPP.dataJsonTreeHtml(book, 0, "") +
    "</div>" +
    "</details>" +
    "</article>"
  );
};
TPP.dataTopLevelObject = function (book) {
  const copy = Object.assign({}, book || {});
  delete copy.meta;
  delete copy.page;
  delete copy.text;
  delete copy.coverFront;
  delete copy.backCover;
  delete copy.spine;
  delete copy.bookInfo;
  delete copy.toc;
  delete copy.files;
  delete copy.textElements;
  delete copy.chapters;
  delete copy.imageElements;
  delete copy.coverImageId;
  delete copy.backImageId;
  delete copy.spineImageId;
  (TPP.COVER_LEGACY_FIELDS || []).forEach(function (field) {
    delete copy[field];
  });
  return copy;
};
TPP.dataPageObject = function (book) {
  const copy = Object.assign({}, (book && book.page) || {});
  delete copy.signatureSize;
  return copy;
};
TPP.dataPrintingObject = function (book) {
  return {
    signatureSize: book && book.page ? book.page.signatureSize : undefined,
  };
};
TPP.dataTabs = function (book, stale) {
  const tabs = [
    {
      id: "top",
      label: "Top-Level",
      html: TPP.dataObjectHtml(
        book,
        TPP.dataTopLevelObject(book),
        false,
        "root",
      ),
    },
    {
      id: "meta",
      label: "Meta",
      html: TPP.dataObjectHtml(
        book,
        book && book.meta ? book.meta : {},
        false,
        "meta",
      ),
    },
    {
      id: "page",
      label: "Page",
      html: TPP.dataObjectHtml(book, TPP.dataPageObject(book), false, "page"),
    },
    {
      id: "text",
      label: "Text",
      html: TPP.dataObjectHtml(
        book,
        book && book.text ? book.text : {},
        false,
        "text",
      ),
    },
    {
      id: "cover-front",
      label: "Cover Front",
      html: TPP.dataObjectHtml(
        book,
        book && book.coverFront ? book.coverFront : {},
        false,
        "coverFront",
      ),
    },
    {
      id: "back-cover",
      label: "Back Cover",
      html: TPP.dataObjectHtml(
        book,
        book && book.backCover ? book.backCover : {},
        false,
        "backCover",
      ),
    },
    {
      id: "spine",
      label: "Spine",
      html: TPP.dataObjectHtml(
        book,
        book && book.spine ? book.spine : {},
        false,
        "spine",
      ),
    },
    {
      id: "book-info",
      label: "Book Info",
      html: TPP.dataObjectHtml(
        book,
        book && book.bookInfo ? book.bookInfo : {},
        false,
        "bookInfo",
      ),
    },
    {
      id: "toc",
      label: "Contents / TOC",
      html: TPP.dataObjectHtml(
        book,
        book && book.toc ? book.toc : {},
        false,
        "toc",
      ),
    },
    {
      id: "printing",
      label: "Printing",
      html: TPP.dataObjectHtml(
        book,
        TPP.dataPrintingObject(book),
        false,
        "printing",
      ),
    },
    {
      id: "files",
      label: "Files",
      html: TPP.dataArrayHtml(
        book,
        "files",
        Array.isArray(book.files) ? book.files : [],
        false,
      ),
    },
    {
      id: "text-elements",
      label: "Text Elements",
      html: TPP.dataArrayHtml(
        book,
        "textElements",
        Array.isArray(book.textElements) ? book.textElements : [],
        false,
      ),
    },
    {
      id: "chapters",
      label: "Chapters",
      html: TPP.dataArrayHtml(
        book,
        "chapters",
        Array.isArray(book.chapters) ? book.chapters : [],
        false,
      ),
    },
    {
      id: "image-elements",
      label: "Image Elements",
      html: TPP.dataArrayHtml(
        book,
        "imageElements",
        Array.isArray(book.imageElements) ? book.imageElements : [],
        false,
      ),
    },
    {
      id: "raw-json",
      label: "Raw JSON",
      html: TPP.dataRawJsonHtml(book),
      bottom: true,
    },
  ];
  if (stale.length)
    tabs.push({
      id: "stale",
      label: "Stale Keys",
      html: TPP.dataStaleReportHtml(stale),
      count: stale.length,
    });
  return tabs;
};
TPP.renderDataPanel = function (tabs, activeId) {
  const active =
    tabs.find(function (tab) {
      return tab.id === activeId;
    }) || tabs[0];
  return (
    '<article class="data-card"><div class="data-tab-panel" role="tabpanel">' +
    (active
      ? active.html
      : '<div class="data-empty">No data available.</div>') +
    "</div></article>"
  );
};
TPP.renderDataSidebar = function (tabs, activeId) {
  const sidebar = document.getElementById("dataSidebar");
  if (!sidebar) return;
  const active =
    tabs.find(function (tab) {
      return tab.id === activeId;
    }) || tabs[0];
  const primaryTabs = tabs.filter(function (tab) {
    return !tab.bottom;
  });
  const bottomTabs = tabs.filter(function (tab) {
    return tab.bottom;
  });
  sidebar.innerHTML =
    '<div class="data-sidebar-head"><h2>Book Data</h2><p>Inspect structured sections of the current book.</p></div>' +
    '<nav class="data-sidebar-nav" aria-label="Data sections">' +
    primaryTabs
      .map(function (tab) {
        const selected = active && tab.id === active.id;
        const label = tab.count
          ? tab.label + " (" + tab.count + ")"
          : tab.label;
        return (
          '<button type="button" class="data-sidebar-link' +
          (selected ? " active" : "") +
          '" data-data-tab="' +
          TPP.esc(tab.id) +
          '">' +
          TPP.esc(label) +
          "</button>"
        );
      })
      .join("") +
    "</nav>" +
    (bottomTabs.length
      ? '<div class="data-sidebar-footer">' +
        bottomTabs
          .map(function (tab) {
            const selected = active && tab.id === active.id;
            return (
              '<button type="button" class="data-sidebar-link data-sidebar-link-bottom' +
              (selected ? " active" : "") +
              '" data-data-tab="' +
              TPP.esc(tab.id) +
              '">' +
              TPP.esc(tab.label) +
              "</button>"
            );
          })
          .join("") +
        "</div>"
      : "");
};
TPP.renderData = function () {
  if (!TPP.active) return;
  TPP.sync("nosave");
  const summary = document.getElementById("dataSummary");
  const panel = document.getElementById("dataPanel");
  if (!summary || !panel) return;
  const book = TPP.clone(TPP.active);
  TPP.dataPreviewStore = {};
  TPP.dataStaleStore = {};
  const stale = TPP.collectDataStaleEntries(book, "root", [], []);
  const tabs = TPP.dataTabs(book, stale);
  const activeTab = TPP.readDataTab(
    tabs.map(function (tab) {
      return tab.id;
    }),
  );
  TPP.renderDataSidebar(tabs, activeTab);
  summary.innerHTML = "";
  summary.hidden = true;
  panel.innerHTML = TPP.renderDataPanel(tabs, activeTab);
};
TPP.registerDataPreview = function (title, body, mode) {
  const id = "preview-" + TPP.uid();
  TPP.dataPreviewStore[id] = {
    title: title || "Data Preview",
    body: body || "",
    mode: mode || "text",
  };
  return id;
};
TPP.openDataImagePreview = function (src, title) {
  const dialog = document.getElementById("dataImageDialog");
  const image = document.getElementById("dataImagePreview");
  const heading = document.getElementById("dataImageTitle");
  if (!dialog || !image || !heading || typeof dialog.showModal !== "function")
    return;
  image.src = src || "";
  heading.textContent = title || "Image Preview";
  if (!dialog.open) dialog.showModal();
};
TPP.openDataTextPreview = function (title, body, mode) {
  const dialog = document.getElementById("dataTextDialog");
  const heading = document.getElementById("dataTextTitle");
  const pre = document.getElementById("dataTextBody");
  if (!dialog || !heading || !pre || typeof dialog.showModal !== "function")
    return;
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
TPP.deleteDataPath = function (root, path) {
  if (!root || !Array.isArray(path) || !path.length) return false;
  let target = root;
  for (let i = 0; i < path.length - 1; i++) {
    target = target[path[i]];
    if (target == null) return false;
  }
  const last = path[path.length - 1];
  if (Array.isArray(target) && typeof last === "number") {
    target.splice(last, 1);
    return true;
  }
  if (
    target &&
    typeof target === "object" &&
    Object.prototype.hasOwnProperty.call(target, last)
  ) {
    delete target[last];
    return true;
  }
  return false;
};
TPP.removeStaleDataEntry = function (id) {
  const entry = TPP.dataStaleStore && TPP.dataStaleStore[id];
  if (!entry || !TPP.active) return;
  if (TPP.deleteDataPath(TPP.active, entry.path)) {
    TPP.save("commit", TPP.bookId(TPP.active));
    TPP.renderAll();
    TPP.toast("Removed " + entry.label);
  }
};
TPP.removeAllStaleDataEntries = function () {
  if (!TPP.active) return;
  const entries = Object.values(TPP.dataStaleStore || {}).sort(function (a, b) {
    return b.path.length - a.path.length;
  });
  let removed = 0;
  entries.forEach(function (entry) {
    if (TPP.deleteDataPath(TPP.active, entry.path)) removed++;
  });
  if (!removed) return;
  TPP.save("commit", TPP.bookId(TPP.active));
  TPP.renderAll();
  TPP.toast("Removed " + removed + " stale key" + (removed === 1 ? "" : "s"));
};
TPP.renderLibrary = function () {
  const q = (
    document.getElementById("librarySearch")?.value || ""
  ).toLowerCase();
  const books = TPP.library.filter(function (book) {
    return !q || TPP.bookText(book).includes(q);
  });
  document.getElementById("libraryGrid").innerHTML = books
    .map(function (book) {
      const size = TPP.sizes[book.pageSize] || {
        w: book.customW || 1,
        h: book.customH || 1,
      };
      const pages = TPP.bookPageCount(book) || "—";
      const modified = TPP.relativeDateTime(TPP.bookUpdatedAt(book));
      return (
        '<article class="library-card ' +
        (TPP.active && TPP.bookId(TPP.active) === TPP.bookId(book)
          ? "active"
          : "") +
        '" data-id="' +
        TPP.bookId(book) +
        '">' +
        '<div class="library-cover" style="' +
        (book.coverPreview
          ? "background-image:url(" + book.coverPreview + ")"
          : "background:linear-gradient(to bottom," +
            book.coverBg1 +
            "," +
            book.coverBg2 +
            ")") +
        '"></div>' +
        '<div class="library-card-body"><h3>' +
        TPP.esc(book.title) +
        "</h3><p>" +
        TPP.esc(book.author) +
        "</p><p>" +
        pages +
        " pages · " +
        Number(size.w).toFixed(2) +
        "×" +
        Number(size.h).toFixed(2) +
        ' in</p><p class="library-meta">Modified ' +
        TPP.esc(modified.label || "—") +
        '</p><div class="toolbar"><button data-act="edit">Edit</button><button data-act="about">About</button><button data-act="view">View</button><button data-act="dup">Duplicate</button><button data-act="export">Export</button></div></div></article>'
      );
    })
    .join("");
};
TPP.renderAbout = function () {
  if (!TPP.active) return;
  const book = TPP.active;
  const pages = TPP.buildPages();
  const settings = TPP.settings();
  const front =
    pages.find(function (page) {
      return page.role === "front";
    }) || pages[0];
  const size = TPP.bookDimensions(book);
  const latest = TPP.bookLatestSource(book);
  const latestRevisionLabel = latest
    ? String(latest.sourceRevision || 1) +
      (latest.sourceSubrevision
        ? "." + String(latest.sourceSubrevision || 0)
        : "")
    : "";
  const original = latest
    ? TPP.library.find(function (candidate) {
        return TPP.bookId(candidate) === latest.sourceId;
      })
    : null;
  const summary = document.getElementById("aboutSummary");
  const panel = document.getElementById("aboutPanel");
  if (!summary || !panel) return;
  const revisionLabel = TPP.bookRevisionLabel(book);
  summary.innerHTML =
    "<strong>Revision " +
    TPP.esc(revisionLabel) +
    "</strong>. " +
    TPP.esc(String(pages.length)) +
    " pages at " +
    TPP.esc(size.w.toFixed(2) + " × " + size.h.toFixed(2)) +
    " in. " +
    (latest
      ? "Latest source: " +
        TPP.esc(
          (latest.action === "import" ? "Imported" : "Copied") +
            " from revision " +
            latestRevisionLabel +
            ".",
        )
      : "No copy/import provenance recorded.");
  panel.innerHTML =
    "<div>" +
    '<article class="about-card">' +
    "<h3>Cover</h3>" +
    '<div class="about-cover-shell"><div id="aboutCoverMount"></div></div>' +
    '<p class="about-note">ID: ' +
    TPP.esc(TPP.bookId(book)) +
    "</p>" +
    "</article>" +
    "</div>" +
    "<div>" +
    '<article class="about-meta">' +
    "<h3>Metadata</h3>" +
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
      TPP.aboutMetaItem(
        "Dimensions",
        size.w.toFixed(2) + " × " + size.h.toFixed(2) + " in",
      ),
      TPP.aboutMetaItem("Book ID", TPP.bookId(book)),
      TPP.aboutMetaItem("Revision", String(TPP.bookRevision(book))),
      TPP.aboutMetaItem("Created", TPP.dateTime(TPP.bookCreatedAt(book))),
      TPP.aboutMetaItem("Last Edited", TPP.dateTime(TPP.bookUpdatedAt(book))),
    ]
      .concat(
        TPP.bookSubrevision(book)
          ? [
              TPP.aboutMetaItem(
                "Subrevision",
                String(TPP.bookSubrevision(book)),
              ),
            ]
          : [],
      )
      .concat(
        TPP.bookLastImportedAt(book)
          ? [
              TPP.aboutMetaItem(
                "Last Imported",
                TPP.dateTime(TPP.bookLastImportedAt(book)),
              ),
            ]
          : [],
      )
      .concat(
        TPP.bookLastExportedAt(book)
          ? [
              TPP.aboutMetaItem(
                "Last Exported",
                TPP.dateTime(TPP.bookLastExportedAt(book)),
              ),
            ]
          : [],
      )
      .join("") +
    "</div>" +
    "</article>" +
    '<article class="about-provenance">' +
    "<h3>Latest Copy / Import</h3>" +
    (latest
      ? '<div class="about-meta-grid">' +
        TPP.aboutMetaItem(
          "Action",
          latest.action === "import" ? "Imported" : "Copied",
        ) +
        TPP.aboutMetaItem("Original ID", latest.sourceId) +
        TPP.aboutMetaItem("Original Title", latest.sourceTitle) +
        TPP.aboutMetaItem(
          "Original Revision",
          String(latest.sourceRevision || 1),
        ) +
        TPP.aboutMetaItem(
          "Original Subrevision",
          String(latest.sourceSubrevision || 0),
        ) +
        TPP.aboutMetaItem(
          "Original Updated",
          TPP.dateTime(latest.sourceUpdatedAt),
        ) +
        TPP.aboutMetaItem("Recorded", TPP.dateTime(latest.recordedAt)) +
        "</div>" +
        (original
          ? '<button type="button" id="aboutOpenOriginal" class="about-link">Open Original Book</button>'
          : '<p class="about-note">Original book is not currently in this library.</p>')
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
    const coverEl = TPP.pageEl(front, settings, 0, 0, false, true, {
      w: settings.page.w,
      h: settings.page.h,
    });
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
    wrap.style.cssText =
      "position:fixed;left:-9999px;top:0;width:" +
      settings.page.w +
      "in;height:" +
      settings.page.h +
      "in";
    wrap.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    document.body.appendChild(wrap);
    const canvas = await html2canvas(wrap, { scale: 4, backgroundColor: null });
    TPP.setCoverPreviewAsset(TPP.active, canvas.toDataURL("image/jpeg", 0.9));
    TPP.bookMeta(TPP.active).pageCount = TPP.lastPages.length;
    wrap.remove();
    TPP.save();
  } catch (error) {
    console.warn(error);
  }
};
