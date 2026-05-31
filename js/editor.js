window.TPP = window.TPP || {};

TPP.bookInfoAddableOptions = function (book) {
  const used = new Set(
    TPP.bookInfo(book)
      .filter(function (entry) {
        return entry && entry.key !== "custom";
      })
      .map(function (entry) {
        return entry.key;
      }),
  );
  return TPP.BOOK_INFO_FIELDS.filter(function (key) {
    return !used.has(key) && !TPP.BOOK_INFO_DEFAULT_FIELDS.includes(key);
  })
    .map(function (key) {
      return { value: key, label: TPP.bookInfoFieldLabel(key, book) };
    })
    .concat([{ value: "__custom_book_info__", label: "Custom Field" }]);
};
TPP.bookInfoFieldInputHtml = function (entry) {
  const spec = TPP.bookInfoFieldSpec(entry.key);
  const value = String(entry.value || "");
  if (spec.input === "textarea") {
    return (
      '<textarea class="book-info-value" rows="' +
      TPP.esc(String(spec.rows || 3)) +
      '">' +
      TPP.esc(value) +
      "</textarea>"
    );
  }
  if (spec.input === "select") {
    return (
      '<select class="book-info-value">' +
      (spec.options || [])
        .map(function (option) {
          return (
            '<option' +
            (option === value ? " selected" : "") +
            ">" +
            TPP.esc(option) +
            "</option>"
          );
        })
        .join("") +
      "</select>"
    );
  }
  return (
    '<input class="book-info-value" type="' +
    TPP.esc(spec.input || "text") +
    '" value="' +
    TPP.esc(value) +
    '">'
  );
};
TPP.bookInfoEntryEditorHtml = function (entry) {
  const removable = !TPP.BOOK_INFO_DEFAULT_FIELDS.includes(entry.key);
  return (
    '<tr class="book-info-entry" data-entry-id="' +
    TPP.esc(entry.id || "") +
    '" data-entry-key="' +
    TPP.esc(entry.key || "") +
    '">' +
    '<td class="book-info-field-cell">' +
    (entry.key === "custom"
      ? '<input class="book-info-custom-label" value="' +
        TPP.esc(entry.customLabel || "") +
        '" placeholder="Custom field">'
      : '<span class="book-info-field-label">' +
        TPP.esc(TPP.bookInfoFieldLabel(TPP.bookInfoFieldRef(entry), TPP.active)) +
        "</span>") +
    "</td>" +
    '<td class="book-info-value-cell">' +
    TPP.bookInfoFieldInputHtml(entry) +
    "</td>" +
    '<td class="book-info-action-cell">' +
    (removable
      ? '<button type="button" class="small book-info-trash" data-book-info-action="remove" aria-label="Remove field" title="Remove field">🗑</button>'
      : "") +
    "</td>" +
    "</tr>"
  );
};
TPP.renderBookInfoControls = function () {
  const container = document.getElementById("bookInfoFields");
  const select = document.getElementById("bookInfoAddField");
  if (container) {
    container.className = "book-info-table-wrap";
    container.innerHTML =
      '<table class="data-table book-info-table"><colgroup><col class="book-info-col-field"><col class="book-info-col-value"><col class="book-info-col-action"></colgroup><thead><tr><th>Field</th><th>Value</th><th></th></tr></thead><tbody>' +
      TPP.bookInfo(TPP.active)
        .map(TPP.bookInfoEntryEditorHtml)
        .join("") +
      "</tbody></table>";
  }
  if (select) {
    select.innerHTML = TPP.bookInfoAddableOptions(TPP.active)
      .map(function (option) {
        return (
          '<option value="' +
          TPP.esc(option.value) +
          '">' +
          TPP.esc(option.label) +
          "</option>"
        );
      })
      .join("");
  }
};
TPP.readBookInfoControls = function (book) {
  if (!book) return;
  const rows = Array.from(document.querySelectorAll(".book-info-entry"));
  if (!rows.length) return;
  const existing = TPP.bookInfo(book);
  book.bookInfo = rows
    .map(function (row) {
      const entry = existing.find(function (item) {
        return item && item.id === row.dataset.entryId;
      });
      if (!entry) return null;
      return {
        id: entry.id,
        key: entry.key,
        value: row.querySelector(".book-info-value")?.value || "",
        customLabel:
          row.querySelector(".book-info-custom-label")?.value || "",
      };
    })
    .filter(Boolean);
};
TPP.addBookInfoEntry = function (book, key) {
  if (!book || !key) return;
  if (key === "__custom_book_info__") key = "custom";
  if (key !== "custom" && TPP.bookInfoEntry(book, key)) return;
  TPP.bookInfo(book).push({
    id: TPP.bookInfoEntryId(key, TPP.uid()),
    key: key,
    value: "",
    customLabel: key === "custom" ? "Custom Field" : "",
  });
};
TPP.removeBookInfoEntry = function (book, id) {
  if (!book) return;
  book.bookInfo = TPP.bookInfo(book).filter(function (entry) {
    return entry && entry.id !== id;
  });
};

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
TPP.textElementEditorConfigs = {
  front: {
    containerId: "coverTextElements",
    location: "front",
    minSize: 3,
    supportsX: false,
    supportsWidth: false,
    supportsAlign: false,
    supportsRotate: false,
    defaultAlign: "center",
  },
  back: {
    containerId: "backTextElements",
    location: "back",
    addLabel: "Add Back Cover Text",
    minSize: 3,
    supportsX: true,
    supportsWidth: true,
    supportsAlign: true,
    supportsRotate: false,
    defaultAlign: "center",
  },
  spine: {
    containerId: "spineTextElements",
    location: "spine",
    addLabel: "Add Spine Text",
    minSize: 3,
    supportsX: true,
    supportsWidth: true,
    supportsAlign: true,
    supportsRotate: true,
    defaultAlign: "left",
  },
};
TPP.frontCoverFieldPickerOptions = function (book) {
  const used = new Set(
    TPP.textElementsForLocation(book, "front").map(function (entry) {
      return (entry && entry.fieldKey) || "";
    }),
  );
  return TPP.bookInfoFieldOptions(book).filter(function (option) {
    return option && option.value && !used.has(option.value);
  });
};
TPP.textElementFieldOptionsHtml = function (selected) {
  const options = TPP.bookInfoFieldOptions(TPP.active, {
    includeInlineCustom: true,
  });
  if (
    selected &&
    !options.some(function (option) {
      return option.value === selected;
    })
  ) {
    options.unshift({
      value: selected,
      label: TPP.bookInfoFieldLabel(selected, TPP.active) + " (Missing)",
    });
  }
  return options
    .map(function (option) {
      return (
        '<option value="' +
        TPP.esc(option.value) +
        '"' +
        (option.value === selected ? " selected" : "") +
        ">" +
        TPP.esc(option.label) +
        "</option>"
      );
    })
    .join("");
};
TPP.frontCoverTextRowHtml = function (book, element) {
  const entry = element || {};
  const fieldKey = entry.fieldKey || entry.part || "title";
  return (
    '<tr class="text-element-group front-cover-text-row" data-text-id="' +
    TPP.esc(entry.id || "") +
    '" data-location="front">' +
    "<td>" +
    TPP.esc(TPP.bookInfoFieldLabel(fieldKey, book)) +
    "</td>" +
    '<td><input class="text-enabled" type="checkbox" ' +
    (entry.enabled !== false ? "checked" : "") +
    "></td>" +
    '<td><input class="text-size" type="number" min="3" step=".5" value="' +
    TPP.esc(String(Number(entry.size) || 4.2)) +
    '"></td>' +
    '<td><input class="text-y" type="range" min="0" max="100" value="' +
    TPP.esc(String(Number(entry.y) || 0)) +
    '"></td>' +
    '<td><input class="text-color color-box" type="color" value="' +
    TPP.esc(entry.color || "#ffffff") +
    '"></td>' +
    '<td><input class="text-outline-color color-box" type="color" value="' +
    TPP.esc(entry.outlineColor || "#000000") +
    '"></td>' +
    '<td><input class="text-outline-size" type="number" min="0" step=".25" value="' +
    TPP.esc(String(Math.max(0, Number(entry.outlineSize) || 0))) +
    '"></td>' +
    '<td class="front-cover-text-actions"><button type="button" class="small" data-text-action="up" aria-label="Move up" title="Move up">↑</button><button type="button" class="small" data-text-action="down" aria-label="Move down" title="Move down">↓</button><button type="button" class="small book-info-trash" data-text-action="remove" aria-label="Remove field" title="Remove field">🗑</button></td>' +
    "</tr>"
  );
};
TPP.frontCoverTextListHtml = function (book, spec) {
  return (
    '<div class="book-info-table-wrap"><table class="data-table front-cover-text-table"><thead><tr><th>Field</th><th>Show</th><th>Size</th><th>Y</th><th>Color</th><th>Outline</th><th>Px</th><th></th></tr></thead><tbody>' +
    TPP.textElementsForLocation(book, spec.location)
      .map(function (element) {
        return TPP.frontCoverTextRowHtml(book, element);
      })
      .join("") +
    "</tbody></table></div>" +
    '<button type="button" class="small" id="openFrontCoverFieldPicker">Add Front Cover Text</button>'
  );
};
TPP.textElementGroupHtml = function (book, spec, element) {
  const entry = element || {};
  const align = entry.align || spec.defaultAlign || "center";
  const fieldKey = entry.fieldKey || entry.part || "title";
  return (
    '<section class="cover-text-group text-element-group" data-text-id="' +
    TPP.esc(entry.id || "") +
    '" data-location="' +
    TPP.esc(spec.location) +
    '">' +
    '<div class="toolbar"><strong>' +
    TPP.esc(TPP.bookInfoFieldLabel(fieldKey, book)) +
    '</strong><span><button type="button" class="small" data-text-action="up">↑</button><button type="button" class="small" data-text-action="down">↓</button><button type="button" class="small" data-text-action="remove">Remove</button></span></div>' +
    '<label>Content<select class="text-field-key">' +
    TPP.textElementFieldOptionsHtml(fieldKey) +
    "</select></label>" +
    '<label><input class="text-enabled" type="checkbox" ' +
    (entry.enabled !== false ? "checked" : "") +
    "> Show this text</label>" +
    (fieldKey === "custom"
      ? '<label>Custom Text<textarea class="text-custom" rows="3">' +
        TPP.esc(entry.customText || "") +
        "</textarea></label>"
      : "") +
    '<div class="two">' +
    '<label>Size <input class="text-size" type="number" min="' +
    spec.minSize +
    '" step=".5" value="' +
    TPP.esc(String(Number(entry.size) || spec.minSize)) +
    '"></label>' +
    '<label>Y <input class="text-y" type="range" min="0" max="100" value="' +
    TPP.esc(String(Number(entry.y) || 0)) +
    '"></label>' +
    "</div>" +
    (spec.supportsX
      ? '<div class="two"><label>X <input class="text-x" type="range" min="0" max="100" value="' +
        TPP.esc(String(Number(entry.x) || 50)) +
        '"></label><label>Width <input class="text-width" type="range" min="10" max="100" value="' +
        TPP.esc(String(Number(entry.width) || 100)) +
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
            (entry.rotate ? "checked" : "") +
            "> Rotate 90°</label>"
          : "") +
        "</div>"
      : "") +
    '<div class="two"><label>Color <input class="text-color color-box" type="color" value="' +
    TPP.esc(entry.color || "#ffffff") +
    '"></label><label>Outline <input class="text-outline-color color-box" type="color" value="' +
    TPP.esc(entry.outlineColor || "#000000") +
    '"></label></div>' +
    '<label>Outline px <input class="text-outline-size" type="number" min="0" step=".25" value="' +
    TPP.esc(String(Math.max(0, Number(entry.outlineSize) || 0))) +
    '"></label>' +
    "</section>"
  );
};
TPP.textElementListHtml = function (book, spec) {
  if (spec.location === "front") return TPP.frontCoverTextListHtml(book, spec);
  const elements = TPP.textElementsForLocation(book, spec.location);
  return (
    elements
      .map(function (element) {
        return TPP.textElementGroupHtml(book, spec, element);
      })
      .join("") +
    '<button type="button" class="small" data-text-action="add" data-location="' +
    TPP.esc(spec.location) +
    '">' +
    TPP.esc(spec.addLabel) +
    "</button>"
  );
};
TPP.copyrightPageItemsHtml = function (book) {
  const items = TPP.copyrightPageInfo(book).items || [];
  return (
    items
      .map(function (item) {
        const fieldKey = item.fieldKey || "copyright";
        return (
          '<section class="cover-text-group copyright-item-group" data-item-id="' +
          TPP.esc(item.id || "") +
          '"><div class="toolbar"><strong>' +
          TPP.esc(TPP.bookInfoFieldLabel(fieldKey, book)) +
          '</strong><span><button type="button" class="small" data-copyright-action="up">↑</button><button type="button" class="small" data-copyright-action="down">↓</button><button type="button" class="small" data-copyright-action="remove">Remove</button></span></div><label>Field<select class="copyright-field-key">' +
          TPP.textElementFieldOptionsHtml(fieldKey) +
          "</select></label>" +
          (fieldKey === "custom"
            ? '<label>Custom Text<textarea class="copyright-custom" rows="3">' +
              TPP.esc(item.customText || "") +
              "</textarea></label>"
            : "") +
          "</section>"
        );
      })
      .join("") +
    '<button type="button" class="small" data-copyright-action="add">Add Copyright Line</button>'
  );
};
TPP.renderTextElementControls = function () {
  if (TPP.renderBookInfoControls) TPP.renderBookInfoControls();
  Object.keys(TPP.textElementEditorConfigs).forEach(function (key) {
    const spec = TPP.textElementEditorConfigs[key];
    const node = document.getElementById(spec.containerId);
    if (!node) return;
    node.className = "cover-text-grid";
    node.innerHTML = TPP.textElementListHtml(TPP.active, spec);
  });
  const copyright = document.getElementById("copyrightPageItems");
  if (copyright) {
    copyright.className = "cover-text-grid";
    copyright.innerHTML = TPP.copyrightPageItemsHtml(TPP.active);
  }
};
TPP.readTextElementControls = function (book) {
  const groups = Array.from(document.querySelectorAll(".text-element-group"));
  if (!groups.length || !book) return;
  groups.forEach(function (group) {
    const element = (book.textElements || []).find(function (entry) {
      return entry && entry.id === group.dataset.textId;
    });
    if (!element) return;
    if (group.querySelector(".text-field-key")) {
      element.fieldKey = group.querySelector(".text-field-key").value || "title";
    }
    element.enabled = group.querySelector(".text-enabled")?.checked !== false;
    if (group.querySelector(".text-custom"))
      element.customText = group.querySelector(".text-custom").value || "";
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
  const copyrightItems = Array.from(
    document.querySelectorAll(".copyright-item-group"),
  );
  if (copyrightItems.length) {
    TPP.copyrightPageInfo(book).items = copyrightItems.map(function (group) {
      const existing = (TPP.copyrightPageInfo(book).items || []).find(
        function (item) {
          return item && item.id === group.dataset.itemId;
        },
      );
      return {
        id: (existing && existing.id) || group.dataset.itemId || TPP.uid(),
        fieldKey:
          group.querySelector(".copyright-field-key")?.value || "copyright",
        customText: group.querySelector(".copyright-custom")?.value || "",
      };
    });
  }
  if (TPP.syncLegacyTextFieldsFromElements)
    TPP.syncLegacyTextFieldsFromElements(book);
};
TPP.addTextElement = function (book, location, fieldKey) {
  if (!book) return;
  const spec = TPP.textElementEditorConfigs[location];
  if (!spec) return;
  book.textElements = Array.isArray(book.textElements) ? book.textElements : [];
  const element = {
    id: TPP.uid(),
    location: location,
    part: "slot-" + TPP.uid(),
    fieldKey: fieldKey || "title",
    enabled: true,
    size: location === "front" ? 4.2 : 4,
    x: 50,
    y: 50,
    width: 100,
    align: spec.defaultAlign,
    color: "#ffffff",
    outlineColor: "#000000",
    outlineSize: 0,
    rotate: false,
    customText: "",
  };
  const lastIndex = book.textElements.reduce(function (found, entry, index) {
    return entry && entry.location === location ? index : found;
  }, -1);
  if (lastIndex < 0) book.textElements.push(element);
  else book.textElements.splice(lastIndex + 1, 0, element);
};
TPP.moveTextElement = function (book, id, direction) {
  const list = Array.isArray(book && book.textElements) ? book.textElements : [];
  const index = list.findIndex(function (entry) {
    return entry && entry.id === id;
  });
  if (index < 0) return;
  const current = list[index];
  const sameLocation = list.filter(function (entry) {
    return entry && entry.location === current.location;
  });
  const localIndex = sameLocation.findIndex(function (entry) {
    return entry && entry.id === id;
  });
  const nextLocal = localIndex + direction;
  if (localIndex < 0 || nextLocal < 0 || nextLocal >= sameLocation.length) return;
  const before = sameLocation[nextLocal];
  const targetIndex = list.findIndex(function (entry) {
    return entry && entry.id === before.id;
  });
  list.splice(index, 1);
  list.splice(targetIndex, 0, current);
};
TPP.removeTextElement = function (book, id) {
  if (!book || !Array.isArray(book.textElements)) return;
  book.textElements = book.textElements.filter(function (entry) {
    return entry && entry.id !== id;
  });
};
TPP.addCopyrightPageItem = function (book) {
  const info = TPP.copyrightPageInfo(book);
  info.items = Array.isArray(info.items) ? info.items : [];
  info.items.push({ id: TPP.uid(), fieldKey: "copyright", customText: "" });
};
TPP.moveCopyrightPageItem = function (book, id, direction) {
  const items = TPP.copyrightPageInfo(book).items || [];
  const index = items.findIndex(function (item) {
    return item && item.id === id;
  });
  if (index < 0) return;
  const next = index + direction;
  if (next < 0 || next >= items.length) return;
  [items[index], items[next]] = [items[next], items[index]];
};
TPP.removeCopyrightPageItem = function (book, id) {
  const info = TPP.copyrightPageInfo(book);
  info.items = (info.items || []).filter(function (item) {
    return item && item.id !== id;
  });
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
  if (TPP.renderBookInfoControls) TPP.renderBookInfoControls();
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
  if (TPP.readBookInfoControls) TPP.readBookInfoControls(book);
  if (TPP.syncTextElementsFromLegacyFields)
    TPP.syncTextElementsFromLegacyFields(book);
  book.signatureSize = TPP.signatureSize(book.signatureSize);
  book.sewingStations = TPP.sewingStations(book.sewingStations);
  book.sewingGuideOpacity = TPP.opacity(book.sewingGuideOpacity, 0.65);
  book.signatureGuideOpacity = TPP.opacity(book.signatureGuideOpacity, 0.65);
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
  const mediaCaptionSize = document.getElementById("mediaCaptionSize");
  if (mediaCaptionSize) mediaCaptionSize.value = book.mediaCaptionSize;
  if (TPP.readTextElementControls) TPP.readTextElementControls(book);
  book.chapters = TPP.readChapterFromEditor();
  if (TPP.syncImageElementsFromLegacyFields)
    TPP.syncImageElementsFromLegacyFields(book);
  if (TPP.syncLegacyImageFieldsFromElements)
    TPP.syncLegacyImageFieldsFromElements(book);
  if (mode !== "nosave") {
    TPP.save(mode || "commit", TPP.bookId(book));
    if (mode === "draft") TPP.scheduleRevisionCommit(TPP.bookId(book));
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
    delete chapter.imageWidth;
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
