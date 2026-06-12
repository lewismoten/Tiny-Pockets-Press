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
  if (spec.input === "authors") {
    const summary = TPP.authorCompactSummary
      ? TPP.authorCompactSummary(value)
      : "Edit authors";
    const fullText = TPP.authorListText
      ? TPP.authorListText(value, { includeRoles: true })
      : "";
    return (
      '<div class="book-info-classification-picker">' +
      '<input class="book-info-value" type="hidden" value="' +
      TPP.esc(value) +
      '">' +
      '<button type="button" class="book-info-classification-button" data-book-info-authors="' +
      TPP.esc(entry.id || "") +
      '" title="' +
      TPP.esc(fullText || summary) +
      '">' +
      '<span class="book-info-classification-title">' +
      TPP.esc(summary || "Edit authors") +
      "</span></button></div>"
    );
  }
  if (spec.input === "picker") {
    const pickerKind = String(spec.picker || entry.key || "").trim();
    const summary =
      TPP.bookInfoPickerSummary &&
      TPP.bookInfoPickerSummary(pickerKind, value, entry)
        ? TPP.bookInfoPickerSummary(pickerKind, value, entry)
        : {
            title:
              pickerKind === "region" ? "Choose region" : "Choose language",
            meta: "No selection",
          };
    return (
      '<div class="book-info-classification-picker">' +
      '<input class="book-info-value" type="hidden" value="' +
      TPP.esc(value) +
      '">' +
      '<button type="button" class="book-info-classification-button" data-book-info-picker="' +
      TPP.esc(entry.id || "") +
      '" data-book-info-picker-kind="' +
      TPP.esc(pickerKind) +
      '">' +
      '<span class="book-info-classification-title">' +
      TPP.esc(summary.title || "Choose option") +
      "</span>" +
      (summary.meta
        ? '<span class="book-info-classification-meta">' +
          TPP.esc(summary.meta) +
          "</span>"
        : "") +
      "</button></div>"
    );
  }
  if (spec.input === "classification") {
    const summaryTitle =
      value && TPP.classificationDisplayString
        ? TPP.classificationDisplayString(
            TPP.active,
            TPP.classificationValueData
              ? TPP.classificationValueData(value)
              : value,
          )
        : "";
    return (
      '<div class="book-info-classification-picker">' +
      '<input class="book-info-value" type="hidden" value="' +
      TPP.esc(value) +
      '">' +
      '<button type="button" class="book-info-classification-button" data-book-info-classification="' +
      TPP.esc(entry.id || "") +
      '">' +
      '<span class="book-info-classification-title">' +
      TPP.esc(summaryTitle || "Choose classification") +
      "</span></button></div>"
    );
  }
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
            "<option" +
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
TPP.bookInfoFieldHelpKey = function (fieldKey) {
  const key = String(fieldKey || "").trim();
  if (!key) return "custom";
  if (key === "__custom_book_info__") return "custom";
  if (key.startsWith("custom:")) return "custom";
  if (key.startsWith("classification:")) return "classification";
  if (key.startsWith("author:")) return "author";
  if (key.startsWith("pubDate:")) return "pubDate";
  return key;
};
TPP.bookInfoFieldHelp = function (fieldKey, book) {
  const helpKey = TPP.bookInfoFieldHelpKey(fieldKey);
  const catalog =
    TPP.bookInfoFieldHelpCatalog &&
    typeof TPP.bookInfoFieldHelpCatalog === "object"
      ? TPP.bookInfoFieldHelpCatalog
      : TPP.defaultBookInfoFieldHelpCatalog || {};
  const entry =
    catalog[helpKey] && typeof catalog[helpKey] === "object"
      ? catalog[helpKey]
      : {};
  const label = TPP.bookInfoFieldLabel(fieldKey, book);
  return {
    key: helpKey,
    label: label,
    description: String(entry.description || "No help text available yet."),
    pdf: String(entry.pdf || "").trim(),
    epub: String(entry.epub || "").trim(),
    mp4: String(entry.mp4 || "").trim(),
    example: String(entry.example || ""),
  };
};
TPP.bookInfoHelpIconSvg = function () {
  return (
    '<svg class="book-info-help-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
    '<circle cx="10" cy="10" r="8" fill="none" stroke="#1d63c8" stroke-width="1.8"></circle>' +
    '<circle cx="10" cy="6" r="1.1" fill="#1d63c8"></circle>' +
    '<path d="M10 8.7v5" stroke="#1d63c8" stroke-width="1.8" stroke-linecap="round"></path>' +
    "</svg>"
  );
};
TPP.bookInfoFieldHelpButtonHtml = function (fieldKey, options) {
  const help = TPP.bookInfoFieldHelp(fieldKey, TPP.active);
  const buttonLabel =
    (options && options.buttonLabel) ||
    "About " + String(help.label || "this field");
  return (
    '<span class="book-info-help" data-book-info-help="' +
    TPP.esc(help.key) +
    '">' +
    '<button type="button" class="book-info-help-button" data-book-info-help-toggle="' +
    TPP.esc(help.key) +
    '" aria-label="' +
    TPP.esc(buttonLabel) +
    '" aria-expanded="false" aria-haspopup="true" title="' +
    TPP.esc(buttonLabel) +
    '">' +
    TPP.bookInfoHelpIconSvg() +
    "</button></span>"
  );
};
TPP.bookInfoEntryEditorHtml = function (entry) {
  const removable = !TPP.BOOK_INFO_DEFAULT_FIELDS.includes(entry.key);
  const fieldRef = entry.key === "custom" ? "custom:" + entry.id : entry.key;
  return (
    '<tr class="book-info-entry" data-entry-id="' +
    TPP.esc(entry.id || "") +
    '" data-entry-key="' +
    TPP.esc(entry.key || "") +
    '">' +
    '<td class="book-info-field-cell">' +
    '<div class="book-info-field-head">' +
    (entry.key === "custom"
      ? '<input class="book-info-custom-label" value="' +
        TPP.esc(entry.customLabel || "") +
        '" placeholder="Custom field">'
      : '<span class="book-info-field-label">' +
        TPP.esc(TPP.bookInfoFieldLabel(fieldRef, TPP.active)) +
        "</span>") +
    TPP.bookInfoFieldHelpButtonHtml(fieldRef) +
    "</div>" +
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
      TPP.bookInfo(TPP.active).map(TPP.bookInfoEntryEditorHtml).join("") +
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
  if (TPP.renderBookInfoAddFieldHelp) TPP.renderBookInfoAddFieldHelp();
};
TPP.renderBookInfoAddFieldHelp = function () {
  const select = document.getElementById("bookInfoAddField");
  const addHelp = document.getElementById("bookInfoAddFieldHelp");
  if (!addHelp) return;
  const selectedValue =
    select && select.value ? select.value : "__custom_book_info__";
  addHelp.innerHTML = TPP.bookInfoFieldHelpButtonHtml(selectedValue, {
    buttonLabel: "About the selected addable field",
  });
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
      const customLabelInput = row.querySelector(".book-info-custom-label");
      return {
        id: entry.id,
        key: entry.key,
        value: row.querySelector(".book-info-value")?.value || "",
        customLabel: customLabelInput
          ? customLabelInput.value || ""
          : String(entry.customLabel || ""),
      };
    })
    .filter(Boolean);
};
TPP.addBookInfoEntry = function (book, key) {
  if (!book || !key) return;
  if (key === "__custom_book_info__") key = "custom";
  if (key !== "custom" && TPP.bookInfoEntry(book, key)) {
    return TPP.bookInfoEntry(book, key);
  }
  const entry = {
    id: TPP.bookInfoEntryId(key),
    key: key,
    value:
      (TPP.defaultBookInfoValueForKey && TPP.defaultBookInfoValueForKey(key)) ||
      "",
    customLabel: key === "custom" ? "Custom Field" : "",
  };
  TPP.bookInfo(book).push(entry);
  return entry;
};
TPP.removeBookInfoEntry = function (book, id) {
  if (!book) return;
  book.bookInfo = TPP.bookInfo(book).filter(function (entry) {
    return entry && entry.id !== id;
  });
};
TPP.bookInfoReferenceFieldKeys = function (book, entryOrId) {
  const entry =
    typeof entryOrId === "string"
      ? TPP.bookInfoEntryById(book, entryOrId)
      : entryOrId;
  if (!entry) return [];
  if (entry.key === "custom") {
    return ["custom:" + String(entry.id || "").trim()];
  }
  if (entry.key === "classification") {
    const formats =
      typeof TPP.classificationFormats === "function"
        ? TPP.classificationFormats()
        : [];
    return ["classification"].concat(
      formats
        .map(function (format) {
          return "classification:" + String((format && format.id) || "").trim();
        })
        .filter(Boolean),
    );
  }
  if (entry.key === "author") {
    const keys = new Set(
      TPP.authorFieldVariantDescriptors(entry.value).map(function (descriptor) {
        return descriptor.key;
      }),
    );
    (TPP.AUTHOR_ROLE_OPTIONS || []).forEach(function (role) {
      keys.add("author:role:" + role);
      keys.add("author:role:" + role + ":inverted");
      keys.add("author:role:" + role + ":inverted-initials");
    });
    return Array.from(keys);
  }
  if (entry.key === "pubDate") {
    return TPP.pubDateFieldVariantDescriptors().map(function (descriptor) {
      return descriptor.key;
    });
  }
  return [String(entry.key || "").trim()].filter(Boolean);
};
TPP.bookInfoUsageReferences = function (book, entryOrId) {
  const entry =
    typeof entryOrId === "string"
      ? TPP.bookInfoEntryById(book, entryOrId)
      : entryOrId;
  const targetKeys = new Set(TPP.bookInfoReferenceFieldKeys(book, entry));
  if (!entry || !targetKeys.size) return [];
  const locationLabels = {
    front: "Front cover",
    back: "Back cover",
    spine: "Spine",
    copyright: "Copyright page",
  };
  const references = [];
  ["front", "back", "spine", "copyright"].forEach(function (location) {
    TPP.textElementsForLocation(book, location).forEach(function (item, index) {
      const fieldKey = String(
        (item && item.fieldKey) || item?.part || "",
      ).trim();
      if (!targetKeys.has(fieldKey)) return;
      references.push({
        kind: "text",
        location: location,
        label:
          (locationLabels[location] || location) + " text " + String(index + 1),
      });
    });
  });
  return references;
};
TPP.removeBookInfoReferences = function (book, entryOrId) {
  if (!book) return 0;
  const targetKeys = new Set(TPP.bookInfoReferenceFieldKeys(book, entryOrId));
  if (!targetKeys.size) return 0;
  let removed = 0;
  if (Array.isArray(book.textElements)) {
    const before = book.textElements.length;
    book.textElements = book.textElements.filter(function (item) {
      const fieldKey = String(
        (item && item.fieldKey) || item?.part || "",
      ).trim();
      return !targetKeys.has(fieldKey);
    });
    removed += before - book.textElements.length;
  }
  return removed;
};

TPP.textElementEditorConfigs = {
  front: {
    containerId: "coverTextElements",
    location: "front",
    addLabel: "Add Front Cover Text",
    minSize: 3,
    supportsX: true,
    supportsWidth: true,
    supportsAlign: true,
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
  copyright: {
    containerId: "copyrightPageItems",
    location: "copyright",
    addLabel: "Add Copyright Text",
    minSize: 3,
    supportsX: true,
    supportsWidth: true,
    supportsAlign: true,
    supportsRotate: false,
    supportsColor: false,
    defaultAlign: "center",
  },
};
TPP.textAlignModes = ["left", "center", "justify", "right", "clip"];
TPP.textAlignMeta = function (mode) {
  const normalized = String(mode || "center")
    .trim()
    .toLowerCase();
  const lookup = {
    left: { label: "Align left", iconId: "align-left" },
    center: { label: "Align center", iconId: "align-center" },
    justify: { label: "Align justify", iconId: "align-justify" },
    right: { label: "Align right", iconId: "align-right" },
    clip: { label: "Clip text", iconId: "align-clip" },
  };
  return lookup[normalized] || lookup.center;
};
TPP.nextTextAlignMode = function (mode) {
  const current = String(mode || "center")
    .trim()
    .toLowerCase();
  const list = TPP.textAlignModes;
  const index = list.indexOf(current);
  return list[(index + 1 + list.length) % list.length];
};
TPP.textAlignIconPath = function (iconId) {
  return (
    {
      "align-left": "assets/align-left.svg",
      "align-center": "assets/align-center.svg",
      "align-justify": "assets/align-justify.svg",
      "align-right": "assets/align-right.svg",
      "align-clip": "assets/align-clip.svg",
    }[iconId] || ""
  );
};
TPP.textAlignCycleButtonHtml = function (mode) {
  const current = String(mode || "center")
    .trim()
    .toLowerCase();
  const meta = TPP.textAlignMeta(current);
  const iconMarkup =
    typeof TPP.renderSvgAsset === "function"
      ? TPP.renderSvgAsset(
          meta.iconId,
          { stroke: "#5a4d40", accent: "#b0572d" },
          {
            class: "text-align-cycle-icon",
            "aria-hidden": "true",
            focusable: "false",
          },
        )
      : '<img src="' +
        TPP.esc(TPP.textAlignIconPath(meta.iconId)) +
        '" alt="" aria-hidden="true">';
  return (
    '<input class="text-align" type="hidden" value="' +
    TPP.esc(current) +
    '">' +
    '<button type="button" class="text-align-cycle" data-text-align-cycle="' +
    TPP.esc(current) +
    '" aria-label="' +
    TPP.esc(meta.label) +
    '" title="' +
    TPP.esc(meta.label) +
    '">' +
    iconMarkup +
    "</button>"
  );
};
TPP.updateTextAlignCycleButton = function (button, mode) {
  if (!button || !TPP.textAlignMeta) return;
  const nextMode = String(mode || "center")
    .trim()
    .toLowerCase();
  const meta = TPP.textAlignMeta(nextMode);
  button.dataset.textAlignCycle = nextMode;
  button.setAttribute("aria-label", meta.label);
  button.setAttribute("title", meta.label);
  if (typeof TPP.renderSvgAsset === "function") {
    button.innerHTML = TPP.renderSvgAsset(
      meta.iconId,
      { stroke: "#5a4d40", accent: "#b0572d" },
      {
        class: "text-align-cycle-icon",
        "aria-hidden": "true",
        focusable: "false",
      },
    );
    return;
  }
  const image = button.querySelector("img");
  if (image) image.setAttribute("src", TPP.textAlignIconPath(meta.iconId));
};
TPP.cycleTextAlignButton = function (button) {
  const hiddenInput = button
    ?.closest(".text-element-group")
    ?.querySelector(".text-align");
  if (!hiddenInput || !TPP.nextTextAlignMode) return;
  const nextMode = TPP.nextTextAlignMode(hiddenInput.value || "");
  hiddenInput.value = nextMode;
  if (TPP.updateTextAlignCycleButton) {
    TPP.updateTextAlignCycleButton(button, nextMode);
  }
  hiddenInput.dispatchEvent(new Event("input", { bubbles: true }));
  hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
};
TPP.textRotationDegrees = function (value) {
  if (value === true) return 90;
  if (value === false || value == null || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};
TPP.finiteNumberOr = function (value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
TPP.rangeInputHtml = function (options) {
  const config = options || {};
  const attrs = [
    'type="range"',
    'class="' + TPP.esc(String(config.className || "").trim()) + '"',
    'min="' + TPP.esc(String(config.min ?? 0)) + '"',
    'max="' + TPP.esc(String(config.max ?? 100)) + '"',
    'value="' + TPP.esc(String(config.value ?? 0)) + '"',
  ];
  if (config.step != null) {
    attrs.push('step="' + TPP.esc(String(config.step)) + '"');
  }
  if (config.unit) {
    attrs.push('data-range-unit="' + TPP.esc(String(config.unit)) + '"');
  }
  if (config.id) {
    attrs.push('id="' + TPP.esc(String(config.id)) + '"');
  }
  if (config.rotationStepKey) {
    attrs.push(
      'data-rotation-step-key="' +
        TPP.esc(String(config.rotationStepKey)) +
        '"',
    );
  }
  if (config.label) {
    attrs.push('aria-label="' + TPP.esc(String(config.label)) + '"');
  }
  return "<input " + attrs.join(" ") + ">";
};
TPP.labeledRangeControlHtml = function (options) {
  const config = options || {};
  return (
    "<label>" +
    (config.label ? "<span>" + TPP.esc(String(config.label)) + "</span>" : "") +
    TPP.rangeInputHtml(config) +
    "</label>"
  );
};
TPP.rangeResetLabelHtml = function (label, targetId, value) {
  return (
    '<button type="button" class="range-reset-label" data-range-reset-target="' +
    TPP.esc(String(targetId || "")) +
    '" data-range-reset-value="' +
    TPP.esc(String(value ?? 50)) +
    '" aria-label="Reset ' +
    TPP.esc(String(label || "")) +
    ' to center" title="Reset ' +
    TPP.esc(String(label || "")) +
    ' to center">' +
    TPP.esc(String(label || "")) +
    "</button>"
  );
};
TPP.textElementFieldPickerOptions = function (book, location) {
  const used = new Set(
    TPP.textElementsForLocation(book, location || "front").map(
      function (entry) {
        return (entry && entry.fieldKey) || "";
      },
    ),
  );
  return TPP.bookInfoFieldOptions(book, {
    includeClassificationFormats: true,
    includeAuthorFormats: true,
    includeDateFormats: true,
  }).filter(function (option) {
    return option && option.value && !used.has(option.value);
  });
};
TPP.frontCoverFieldPickerOptions = function (book) {
  return TPP.textElementFieldPickerOptions(book, "front");
};
TPP.textElementFieldOptionsHtml = function (selected) {
  const options = TPP.bookInfoFieldOptions(TPP.active, {
    includeInlineCustom: true,
    includeClassificationFormats: true,
    includeAuthorFormats: true,
    includeDateFormats: true,
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
TPP.coverTextRowHtml = function (book, spec, element) {
  const entry = element || {};
  const location = spec && spec.location ? spec.location : "front";
  const supportsColor = spec.supportsColor !== false;
  const sizeValue = TPP.finiteNumberOr(
    entry.size,
    location === "front" ? 4.2 : TPP.finiteNumberOr(spec && spec.minSize, 4),
  );
  const sizeMin = TPP.finiteNumberOr(spec && spec.minSize, 3);
  const rotationValue = TPP.textRotationDegrees(entry.rotate);
  const rotationInputId =
    location === "spine" ? "text-rotate-" + TPP.uid() : "";
  const rotationStepKey =
    location === "spine" && entry.id ? "text-rotate:" + entry.id : "";
  const textXInputId = "text-x-" + TPP.uid();
  const textYInputId = "text-y-" + TPP.uid();
  return (
    '<tr class="text-element-group cover-text-row" draggable="true" data-drag-kind="text-element" data-text-id="' +
    TPP.esc(entry.id || "") +
    '" data-location="' +
    TPP.esc(location) +
    '">' +
    TPP.coverTextContentCellHtml(book, entry) +
    "<td>" +
    ('<div class="cover-text-size-stack">' +
      TPP.labeledRangeControlHtml({
        label: "Sz",
        className: "text-size",
        min: sizeMin,
        max: 24,
        step: 0.25,
        unit: "pt",
        value: sizeValue,
      }) +
      (location === "spine"
        ? '<label class="rotation-range-label"><span>Rot</span><span class="rotation-range-control">' +
          TPP.rangeInputHtml({
            id: rotationInputId,
            rotationStepKey: rotationStepKey,
            label: "Rotation",
            className: "text-rotate",
            min: -180,
            max: 180,
            step: 1,
            unit: "°",
            value: rotationValue,
          }) +
          '<button type="button" class="rotation-step-cycle" data-rotation-step-cycle="' +
          TPP.esc(rotationInputId) +
          '" aria-label="Rotation step 1 degrees" title="Rotation step 1 degrees"><span aria-hidden="true">⟳</span><span>1°</span></button></span></label>'
        : "") +
      "</div>") +
    "</td>" +
    '<td><div class="back-cover-slider-stack"><label>' +
    TPP.rangeResetLabelHtml("X", textXInputId, 50) +
    TPP.rangeInputHtml({
      id: textXInputId,
      label: "X",
      className: "text-x",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      value: TPP.finiteNumberOr(entry.x, 50),
    }) +
    "</label><label>" +
    TPP.rangeResetLabelHtml("Y", textYInputId, 50) +
    TPP.rangeInputHtml({
      id: textYInputId,
      label: "Y",
      className: "text-y",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      value: TPP.finiteNumberOr(entry.y, 0),
    }) +
    "</div></td>" +
    '<td><div class="back-cover-align-stack">' +
    TPP.textAlignCycleButtonHtml(entry.align || "center") +
    "<label>" +
    TPP.rangeInputHtml({
      label: "Width",
      className: "text-width",
      min: 10,
      max: 100,
      step: 1,
      unit: "%",
      value: TPP.finiteNumberOr(entry.width, 100),
    }) +
    "</label></div></td>" +
    (supportsColor
      ? "<td>" + TPP.textColorOutlineControlHtml(entry) + "</td>"
      : "") +
    "</tr>"
  );
};
TPP.coverTextContentCellHtml = function (book, element) {
  const entry = element || {};
  const fieldKey = entry.fieldKey || entry.part || "title";
  const customText = String(entry.customText || "").trim();
  const customPreview = customText || "Custom text";
  return (
    '<td><div class="back-cover-text-field-cell"><div class="back-cover-text-field-top"><span class="drag-handle" data-drag-handle="1" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</span><span class="back-cover-text-field-label' +
    (fieldKey === "custom" ? " is-custom" : "") +
    '">' +
    TPP.esc(
      fieldKey === "custom"
        ? customPreview
        : TPP.bookInfoFieldLabel(fieldKey, book),
    ) +
    "</span></div></div></td>"
  );
};
TPP.textColorOutlineControlHtml = function (entry) {
  const textColor = entry.color || "#ffffff";
  const outlineColor = entry.outlineColor || "#000000";
  const outlineSize = String(
    Math.max(0, TPP.finiteNumberOr(entry.outlineSize, 0)),
  );
  const textInputId = "text-fill-" + TPP.uid();
  const outlineInputId = "text-outline-" + TPP.uid();
  const outlineIcon =
    typeof TPP.renderSvgAsset === "function"
      ? TPP.renderSvgAsset(
          "text-outline-control",
          {},
          {
            class: "front-cover-text-outline-icon",
            "aria-hidden": "true",
            focusable: "false",
          },
        )
      : '<img class="front-cover-text-outline-icon" src="assets/text-outline-control.svg" alt="" aria-hidden="true">';
  return (
    '<div class="front-cover-text-outline-cell" style="--text-fill-color:' +
    TPP.esc(textColor) +
    ";--text-outline-color:" +
    TPP.esc(outlineColor) +
    '"><div class="front-cover-text-outline-pair"><input class="text-color text-swatch-input" data-color-input-id="' +
    TPP.esc(textInputId) +
    '" type="color" tabindex="-1" aria-label="Text color" value="' +
    TPP.esc(textColor) +
    '">' +
    outlineIcon +
    '<button type="button" class="front-cover-text-outline-hit front-cover-text-outline-hit-fill" data-color-swatch-target="' +
    TPP.esc(textInputId) +
    '" aria-label="Choose text color" title="' +
    TPP.esc(textColor) +
    '"></button><button type="button" class="front-cover-text-outline-hit front-cover-text-outline-hit-outline" data-color-swatch-target="' +
    TPP.esc(outlineInputId) +
    '" aria-label="Choose outline color" title="' +
    TPP.esc(outlineColor) +
    '"></button><input class="text-outline-color text-swatch-input" data-color-input-id="' +
    TPP.esc(outlineInputId) +
    '" type="color" tabindex="-1" aria-label="Outline color" value="' +
    TPP.esc(outlineColor) +
    '"></div>' +
    TPP.rangeInputHtml({
      label: "Outline size",
      className: "text-outline-size",
      min: 0,
      max: 12,
      step: 0.25,
      unit: "px",
      value: outlineSize,
    }) +
    "</div>"
  );
};
TPP.coverTextListHtml = function (book, spec) {
  const location = spec && spec.location ? spec.location : "front";
  const addLabel = spec.addLabel || "Add Text";
  const supportsColor = spec.supportsColor !== false;
  const trashIdMap = {
    front: "frontCoverTrashDrop",
    back: "backCoverTrashDrop",
    spine: "spineTextTrashDrop",
    copyright: "copyrightTextTrashDrop",
  };
  const trashId = trashIdMap[location] || "frontCoverTrashDrop";
  const colgroup =
    '<colgroup><col class="cover-text-col-field"><col class="cover-text-col-size"><col class="cover-text-col-position"><col class="cover-text-col-align">' +
    (supportsColor ? '<col class="cover-text-col-outline">' : "") +
    "</colgroup>";
  const headings =
    "<tr><th>Content</th><th>Sz</th><th>Pos</th><th>Width</th>" +
    (supportsColor ? "<th>Color</th>" : "") +
    "</tr>";
  return (
    '<div class="book-info-table-wrap"><table class="data-table cover-text-table' +
    (supportsColor ? "" : " cover-text-table--plain") +
    '">' +
    colgroup +
    "<thead>" +
    headings +
    "</thead><tbody>" +
    TPP.textElementsForLocation(book, location)
      .map(function (element) {
        return TPP.coverTextRowHtml(book, spec, element);
      })
      .join("") +
    '</tbody></table></div><div class="' +
    "cover-text-actions-bar" +
    '"><button type="button" class="small" data-text-action="add" data-location="' +
    TPP.esc(location) +
    '">' +
    TPP.esc(addLabel) +
    '</button><div id="' +
    TPP.esc(trashId) +
    '" class="front-cover-trash-drop" aria-hidden="true"><span class="front-cover-trash-icon">🗑</span><span>Drop here to remove</span></div></div>'
  );
};
TPP.textElementGroupHtml = function (book, spec, element) {
  const entry = element || {};
  const align = entry.align || spec.defaultAlign || "center";
  const fieldKey = entry.fieldKey || entry.part || "title";
  return (
    '<section class="cover-text-group text-element-group" draggable="true" data-drag-kind="text-element" data-text-id="' +
    TPP.esc(entry.id || "") +
    '" data-location="' +
    TPP.esc(spec.location) +
    '">' +
    '<div class="toolbar"><strong><span class="drag-handle" data-drag-handle="1" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</span>' +
    TPP.esc(TPP.bookInfoFieldLabel(fieldKey, book)) +
    '</strong><span><button type="button" class="small" data-text-action="remove">Remove</button></span></div>' +
    '<label>Content<select class="text-field-key">' +
    TPP.textElementFieldOptionsHtml(fieldKey) +
    "</select></label>" +
    (fieldKey === "custom"
      ? '<label>Custom Text<textarea class="text-custom" rows="3">' +
        TPP.esc(entry.customText || "") +
        "</textarea></label>"
      : "") +
    '<div class="two">' +
    "<label>Size " +
    TPP.rangeInputHtml({
      label: "Size",
      className: "text-size",
      min: spec.minSize,
      max: 24,
      step: 0.25,
      unit: "pt",
      value: TPP.finiteNumberOr(entry.size, spec.minSize),
    }) +
    "</label>" +
    "<label>Y " +
    TPP.rangeInputHtml({
      label: "Y",
      className: "text-y",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      value: TPP.finiteNumberOr(entry.y, 0),
    }) +
    "</label>" +
    "</div>" +
    (spec.supportsX
      ? '<div class="two"><label>X ' +
        TPP.rangeInputHtml({
          label: "X",
          className: "text-x",
          min: 0,
          max: 100,
          step: 1,
          unit: "%",
          value: TPP.finiteNumberOr(entry.x, 50),
        }) +
        "</label><label>Width " +
        TPP.rangeInputHtml({
          label: "Width",
          className: "text-width",
          min: 10,
          max: 100,
          step: 1,
          unit: "%",
          value: TPP.finiteNumberOr(entry.width, 100),
        }) +
        "</label></div>"
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
    "<label>Outline " +
    TPP.rangeInputHtml({
      label: "Outline size",
      className: "text-outline-size",
      min: 0,
      max: 12,
      step: 0.25,
      unit: "px",
      value: Math.max(0, TPP.finiteNumberOr(entry.outlineSize, 0)),
    }) +
    "</label>" +
    "</section>"
  );
};
TPP.textElementListHtml = function (book, spec) {
  if (
    spec.location === "front" ||
    spec.location === "back" ||
    spec.location === "spine" ||
    spec.location === "copyright"
  )
    return TPP.coverTextListHtml(book, spec);
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
TPP.renderTextElementControls = function () {
  if (TPP.renderBookInfoControls) TPP.renderBookInfoControls();
  Object.keys(TPP.textElementEditorConfigs).forEach(function (key) {
    const spec = TPP.textElementEditorConfigs[key];
    const node = document.getElementById(spec.containerId);
    if (!node) return;
    node.className =
      spec.location === "front" ||
      spec.location === "back" ||
      spec.location === "spine" ||
      spec.location === "copyright"
        ? "cover-text-layout"
        : "cover-text-grid";
    node.innerHTML = TPP.textElementListHtml(TPP.active, spec);
  });
  if (TPP.refreshRangeInputTitles) TPP.refreshRangeInputTitles(document);
  if (TPP.refreshRotationStepButtons) TPP.refreshRotationStepButtons(document);
};
TPP.readSingleTextElementGroup = function (book, group) {
  if (!book || !group) return;
  const element = (book.textElements || []).find(function (entry) {
    return entry && entry.id === group.dataset.textId;
  });
  if (!element) return;
  if (group.querySelector(".text-field-key")) {
    element.fieldKey = group.querySelector(".text-field-key").value || "title";
  }
  element.enabled = true;
  if (group.querySelector(".text-custom")) {
    element.customText = group.querySelector(".text-custom").value || "";
  }
  if (group.querySelector(".back-cover-text-custom-value")) {
    element.customText =
      group.querySelector(".back-cover-text-custom-value").value || "";
  }
  element.size =
    Number(group.querySelector(".text-size")?.value) || element.size || 4;
  element.y = TPP.finiteNumberOr(group.querySelector(".text-y")?.value, 0);
  if (group.querySelector(".text-x")) {
    element.x = TPP.finiteNumberOr(group.querySelector(".text-x").value, 50);
  }
  if (group.querySelector(".text-width")) {
    element.width = Math.max(
      10,
      Math.min(
        100,
        TPP.finiteNumberOr(group.querySelector(".text-width").value, 100),
      ),
    );
  }
  if (group.querySelector(".text-align")) {
    element.align = group.querySelector(".text-align").value || "left";
  }
  if (group.querySelector(".text-rotate")) {
    const rotateInput = group.querySelector(".text-rotate");
    element.rotate =
      rotateInput.type === "checkbox"
        ? rotateInput.checked
        : TPP.textRotationDegrees(rotateInput.value);
  }
  element.color = group.querySelector(".text-color")?.value || element.color;
  element.outlineColor =
    group.querySelector(".text-outline-color")?.value || element.outlineColor;
  element.outlineSize = Math.max(
    0,
    TPP.finiteNumberOr(group.querySelector(".text-outline-size")?.value, 0),
  );
};
TPP.readTextElementControls = function (book) {
  const groups = Array.from(document.querySelectorAll(".text-element-group"));
  if (!groups.length || !book) return;
  groups.forEach(function (group) {
    TPP.readSingleTextElementGroup(book, group);
  });
  const orderedTextIds = groups
    .map(function (group) {
      return group.dataset.textId || "";
    })
    .filter(Boolean);
  if (orderedTextIds.length && Array.isArray(book.textElements)) {
    const byId = new Map(
      book.textElements.map(function (entry) {
        return [entry && entry.id, entry];
      }),
    );
    const ordered = orderedTextIds
      .map(function (id) {
        return byId.get(id) || null;
      })
      .filter(Boolean);
    const seen = new Set(
      ordered.map(function (entry) {
        return entry.id;
      }),
    );
    book.textElements = ordered.concat(
      book.textElements.filter(function (entry) {
        return entry && !seen.has(entry.id);
      }),
    );
  }
  if (TPP.syncLegacyTextFieldsFromElements)
    TPP.syncLegacyTextFieldsFromElements(book);
};
TPP.coverPageDimensions = function (book) {
  const page = (book && book.page) || {};
  return {
    w: Math.max(1, Number(page.w || book?.w || 6) || 6),
    h: Math.max(1, Number(page.h || book?.h || 9) || 9),
  };
};
TPP.frontCoverTextBounds = function (book, element) {
  const entry = element || {};
  const dims = TPP.coverPageDimensions(book);
  const widthPercent = Math.max(10, Math.min(100, Number(entry.width) || 100));
  const sizePt = Math.max(3, Number(entry.size) || 4.2);
  const outlineSize = Math.max(0, Number(entry.outlineSize) || 0);
  const widthIn = dims.w * (widthPercent / 100);
  const rawText = TPP.bookInfoFieldValue(book, entry.fieldKey || entry.part, {
    location: "front",
    customText: entry.customText,
  });
  const text = String(rawText || "").trim();
  const approxCharsPerLine = Math.max(
    6,
    Math.floor((widthIn * 72) / Math.max(1, sizePt * 0.58)),
  );
  const lines = Math.max(
    1,
    text
      ? text.split(/\n+/).reduce(function (count, line) {
          return (
            count + Math.max(1, Math.ceil(line.length / approxCharsPerLine))
          );
        }, 0)
      : 1,
  );
  const lineHeightPt = sizePt * 1.22 + outlineSize * 2;
  const heightPercent = Math.max(
    2.25,
    (lines * lineHeightPt * 100) / (dims.h * 72),
  );
  const top = Math.max(0, Math.min(100, Number(entry.y) || 0));
  return {
    top: top,
    bottom: Math.min(100, top + heightPercent),
    height: Math.min(100, heightPercent),
  };
};
TPP.frontCoverPlacementScore = function (
  candidateTop,
  candidateHeight,
  bounds,
) {
  const top = Math.max(0, candidateTop);
  const bottom = Math.min(100, top + candidateHeight);
  return bounds.reduce(function (score, bound) {
    const overlap = Math.max(
      0,
      Math.min(bottom, bound.bottom) - Math.max(top, bound.top),
    );
    return score + overlap;
  }, 0);
};
TPP.bestFrontCoverTextY = function (book, elements, prototype, preferredY) {
  const candidateBounds = TPP.frontCoverTextBounds(book, prototype);
  const height = Math.min(100, candidateBounds.height);
  const maxTop = Math.max(0, 100 - height);
  const bounds = elements.map(function (entry) {
    return TPP.frontCoverTextBounds(book, entry);
  });
  const normalizedPreferred = Math.max(0, Math.min(maxTop, preferredY || 0));
  let bestY = normalizedPreferred;
  let bestScore = Infinity;
  for (let y = 0; y <= maxTop; y += 0.5) {
    const overlap = TPP.frontCoverPlacementScore(y, height, bounds);
    const distance = Math.abs(y - normalizedPreferred) * 0.08;
    const score = overlap * 100 + distance;
    if (score < bestScore) {
      bestScore = score;
      bestY = y;
      if (overlap <= 0 && y >= normalizedPreferred) return y;
    }
  }
  return bestY;
};
TPP.addTextElement = function (book, location, fieldKey) {
  if (!book) return;
  const spec = TPP.textElementEditorConfigs[location];
  if (!spec) return;
  book.textElements = Array.isArray(book.textElements) ? book.textElements : [];
  const existing = TPP.textElementsForLocation(book, location);
  const lastElement = existing.length ? existing[existing.length - 1] : null;
  const element = {
    id: TPP.internalId("t"),
    location: location,
    part: TPP.internalId("s"),
    fieldKey: fieldKey || "title",
    enabled: true,
    size:
      Number(lastElement && lastElement.size) ||
      (location === "front" ? 4.2 : 4),
    x: TPP.finiteNumberOr(lastElement && lastElement.x, 50),
    y: TPP.finiteNumberOr(lastElement && lastElement.y, 50),
    width: Math.max(10, Number(lastElement && lastElement.width) || 100),
    align: (lastElement && lastElement.align) || spec.defaultAlign,
    color: (lastElement && lastElement.color) || "#ffffff",
    outlineColor: (lastElement && lastElement.outlineColor) || "#000000",
    outlineSize: Math.max(
      0,
      TPP.finiteNumberOr(lastElement && lastElement.outlineSize, 0),
    ),
    rotate: spec.supportsRotate
      ? TPP.textRotationDegrees(lastElement && lastElement.rotate)
      : 0,
    customText: "",
  };
  if (location === "front") {
    const dims = TPP.coverPageDimensions(book);
    const previousBounds = lastElement
      ? TPP.frontCoverTextBounds(book, lastElement)
      : null;
    const gap = Math.max(
      1.25,
      (Math.max(3, Number(element.size) || 4.2) * 1.15 * 100) / (dims.h * 72),
    );
    const preferredY = previousBounds
      ? Math.min(100, previousBounds.bottom + gap)
      : 12;
    element.y = TPP.bestFrontCoverTextY(book, existing, element, preferredY);
  }
  const lastIndex = book.textElements.reduce(function (found, entry, index) {
    return entry && entry.location === location ? index : found;
  }, -1);
  if (lastIndex < 0) book.textElements.push(element);
  else book.textElements.splice(lastIndex + 1, 0, element);
};
TPP.moveTextElement = function (book, id, direction) {
  const list = Array.isArray(book && book.textElements)
    ? book.textElements
    : [];
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
  if (localIndex < 0 || nextLocal < 0 || nextLocal >= sameLocation.length)
    return;
  const before = sameLocation[nextLocal];
  const targetIndex = list.findIndex(function (entry) {
    return entry && entry.id === before.id;
  });
  list.splice(index, 1);
  list.splice(targetIndex, 0, current);
};
TPP.moveTextElementToTarget = function (book, id, targetId, before) {
  const list = Array.isArray(book && book.textElements)
    ? book.textElements
    : [];
  const sourceIndex = list.findIndex(function (entry) {
    return entry && entry.id === id;
  });
  const targetIndex = list.findIndex(function (entry) {
    return entry && entry.id === targetId;
  });
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
  const source = list[sourceIndex];
  const target = list[targetIndex];
  if (!source || !target || source.location !== target.location) return;
  list.splice(sourceIndex, 1);
  const nextTargetIndex = list.findIndex(function (entry) {
    return entry && entry.id === targetId;
  });
  list.splice(Math.max(0, nextTargetIndex + (before ? 0 : 1)), 0, source);
};
TPP.removeTextElement = function (book, id) {
  if (!book || !Array.isArray(book.textElements)) return;
  book.textElements = book.textElements.filter(function (entry) {
    return entry && entry.id !== id;
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
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
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
    TPP.save(mode || "draft", TPP.bookId(book));
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
    const chapterSettings = TPP.chapterSettingsInfo(TPP.active);
    chapter.title = card.querySelector(".chapter-title").value;
    chapter.text = card.querySelector(".chapter-text").value;
    chapterSettings.imagePlacement = card.querySelector(
      ".chapter-image-placement",
    ).value;
    chapterSettings.imageZoom = Math.min(
      100,
      Math.max(
        10,
        Number(card.querySelector(".chapter-image-zoom").value) || 70,
      ),
    );
    chapter.level = Math.max(0, Number(chapter.level) || 0);
    chapter.isMetadata = card.querySelector(".chapter-metadata").checked;
    chapter.includeInToc = card.querySelector(".chapter-toc").checked;
    chapter.tocTitle = card.querySelector(".chapter-toc-title").value;
  }
  return copy;
};
TPP.chapterBlockRange = function (chapters, startIndex) {
  const list = Array.isArray(chapters) ? chapters : [];
  const start = Math.max(0, Math.min(Number(startIndex) || 0, list.length));
  const rootLevel = Math.max(0, Number(list[start] && list[start].level) || 0);
  let end = start + 1;
  while (end < list.length) {
    const level = Math.max(0, Number(list[end] && list[end].level) || 0);
    if (level <= rootLevel) break;
    end += 1;
  }
  return {
    start: start,
    end: end,
    rootLevel: rootLevel,
  };
};
TPP.chapterDropLevelFromEvent = function (list, event, row, position) {
  if (!list || !event) return 0;
  if (row) {
    const rowLevel = Math.max(0, Number(row.dataset.level) || 0);
    const rect = row.getBoundingClientRect();
    const relativeIndent = Math.max(
      0,
      Math.floor((event.clientX - rect.left - 34) / 28),
    );
    const requested =
      rowLevel +
      relativeIndent +
      (position === "after" && relativeIndent > 0 ? 1 : 0);
    return Math.max(
      0,
      Math.min(position === "before" ? rowLevel : 5, requested),
    );
  }
  const rect = list.getBoundingClientRect();
  const indent = Math.floor((event.clientX - rect.left - 26) / 28);
  return Math.max(0, Math.min(5, indent));
};
TPP.chapterMaxLevelAtInsert = function (chapters, insertIndex) {
  if (!Array.isArray(chapters) || insertIndex <= 0) return 0;
  return Math.min(
    5,
    Math.max(
      0,
      Number(chapters[insertIndex - 1] && chapters[insertIndex - 1].level) || 0,
    ) + 1,
  );
};
TPP.chapterAllowedDropLevel = function (
  chapters,
  sourceIndex,
  targetIndex,
  position,
  requestedLevel,
) {
  const list = Array.isArray(chapters) ? chapters.slice() : [];
  if (!list.length) return 0;
  const source = TPP.chapterBlockRange(list, sourceIndex);
  const remaining = list.slice(0, source.start).concat(list.slice(source.end));
  let adjustedTarget = Number(targetIndex) || 0;
  if (adjustedTarget > source.start)
    adjustedTarget -= source.end - source.start;
  adjustedTarget = Math.max(0, Math.min(adjustedTarget, remaining.length - 1));
  const targetRange = TPP.chapterBlockRange(remaining, adjustedTarget);
  const insertIndex =
    position === "before" ? targetRange.start : targetRange.end;
  const maxLevel = TPP.chapterMaxLevelAtInsert(remaining, insertIndex);
  return Math.max(
    0,
    Math.min(maxLevel, Math.max(0, Number(requestedLevel) || 0)),
  );
};
TPP.clearChapterDropState = function () {
  TPP.chapterDragState = null;
};
TPP.chapterParentInfoAt = function (chapters, index) {
  const list = Array.isArray(chapters) ? chapters : [];
  const current = list[index];
  const level = Math.max(0, Number(current && current.level) || 0);
  if (!current || level <= 0) return null;
  for (let i = index - 1; i >= 0; i -= 1) {
    const candidate = list[i];
    const candidateLevel = Math.max(
      0,
      Number(candidate && candidate.level) || 0,
    );
    if (candidateLevel === level - 1) {
      return {
        index: i,
        title: String((candidate && candidate.title) || "Untitled"),
      };
    }
  }
  return null;
};
TPP.chapterDragPreviewInfo = function () {
  const state = TPP.chapterDragState || null;
  if (!state || !TPP.active || !Array.isArray(TPP.active.chapters)) return null;
  const sourceChapter = TPP.active.chapters[state.sourceIndex];
  if (!sourceChapter || !sourceChapter.id) return null;
  const result = TPP.moveChapterBlock(
    TPP.active.chapters,
    state.sourceIndex,
    state.targetIndex,
    state.position,
    state.level,
  );
  const chapters =
    result && Array.isArray(result.chapters)
      ? result.chapters
      : TPP.active.chapters;
  const nextIndex = chapters.findIndex(function (chapter) {
    return chapter && chapter.id === sourceChapter.id;
  });
  if (nextIndex < 0) return null;
  const number = TPP.chapterOutlineNumber(chapters, nextIndex);
  const parent = TPP.chapterParentInfoAt(chapters, nextIndex);
  return {
    chapter: chapters[nextIndex],
    nextIndex: nextIndex,
    level: Math.max(
      0,
      Number(chapters[nextIndex] && chapters[nextIndex].level) || 0,
    ),
    number: number,
    label: parent ? "Under " + parent.title : "Top level",
  };
};
TPP.applyChapterDropState = function () {
  const list = document.getElementById("chapterList");
  if (!list) return;
  list.querySelectorAll(".chapter-drag-preview-ghost").forEach(function (node) {
    node.remove();
  });
  const rows = list.querySelectorAll("[data-i]");
  const state = TPP.chapterDragState || null;
  const preview = TPP.chapterDragPreviewInfo();
  rows.forEach(function (row) {
    const index = Number(row.dataset.i);
    row.classList.remove(
      "drop-before",
      "drop-after",
      "dragging",
      "chapter-drag-source-placeholder",
    );
    row.style.setProperty("--drop-level", "0");
    if (!state) return;
    if (index === state.sourceIndex)
      row.classList.add("dragging", "chapter-drag-source-placeholder");
    if (index === state.targetIndex) {
      row.classList.add(
        state.position === "before" ? "drop-before" : "drop-after",
      );
      row.style.setProperty(
        "--drop-level",
        String(Math.max(0, Number(state.level) || 0)),
      );
    }
  });
  if (!state || !preview) return;
  const sourceRow = list.querySelector(
    '[data-i="' + String(state.sourceIndex) + '"]',
  );
  const targetRow = list.querySelector(
    '[data-i="' + String(state.targetIndex) + '"]',
  );
  if (!sourceRow || !targetRow) return;
  const ghost = sourceRow.cloneNode(true);
  ghost.classList.remove(
    "active",
    "dragging",
    "drop-before",
    "drop-after",
    "chapter-drag-source-placeholder",
  );
  if ((preview.level || 0) > 0) ghost.classList.add("subchapter");
  else ghost.classList.remove("subchapter");
  ghost.classList.add("chapter-drag-preview-ghost");
  ghost.removeAttribute("draggable");
  ghost.removeAttribute("data-i");
  ghost.setAttribute("aria-hidden", "true");
  ghost.dataset.level = String(preview.level || 0);
  ghost.style.setProperty("--level", String(preview.level || 0));
  ghost.style.setProperty("--drop-level", "0");
  const numberEl = ghost.querySelector(".chapter-pill-index");
  if (numberEl) numberEl.textContent = String(preview.number) + ".";
  const titleEl = ghost.querySelector(".chapter-pill-title");
  if (titleEl)
    titleEl.textContent = String(
      (preview.chapter && preview.chapter.title) || "Untitled",
    );
  const badgesEl = ghost.querySelector(".chapter-pill-badges");
  if (badgesEl) {
    badgesEl.innerHTML =
      '<span class="chapter-pill-badge preview-badge">' +
      TPP.esc(preview.label) +
      "</span>";
  } else {
    const textEl = ghost.querySelector(".chapter-pill-text");
    if (textEl) {
      textEl.insertAdjacentHTML(
        "beforeend",
        '<span class="chapter-pill-badges"><span class="chapter-pill-badge preview-badge">' +
          TPP.esc(preview.label) +
          "</span></span>",
      );
    }
  }
  if (state.position === "before") targetRow.before(ghost);
  else targetRow.after(ghost);
};
TPP.moveChapterBlock = function (
  chapters,
  sourceIndex,
  targetIndex,
  position,
  level,
) {
  const list = Array.isArray(chapters) ? chapters.slice() : [];
  if (!list.length) return null;
  const source = TPP.chapterBlockRange(list, sourceIndex);
  const selectedId =
    list[TPP.currentChapter] && list[TPP.currentChapter].id
      ? list[TPP.currentChapter].id
      : "";
  const block = list.slice(source.start, source.end).map(function (chapter) {
    return Object.assign({}, chapter);
  });
  const rootLevel = source.rootLevel;
  const levelOffsets = block.map(function (chapter) {
    return Math.max(0, Number(chapter && chapter.level) || 0) - rootLevel;
  });
  if (targetIndex >= source.start && targetIndex < source.end) {
    const maxRootLevel = TPP.chapterMaxLevelAtInsert(list, source.start);
    const nextRootLevel = Math.max(
      0,
      Math.min(maxRootLevel, Math.max(0, Number(level) || 0)),
    );
    if (nextRootLevel === rootLevel) return null;
    block.forEach(function (chapter, index) {
      chapter.level = Math.max(
        0,
        Math.min(5, nextRootLevel + levelOffsets[index]),
      );
    });
    const updated = list.slice();
    updated.splice(source.start, block.length, ...block);
    const currentIndex = selectedId
      ? updated.findIndex(function (chapter) {
          return chapter && chapter.id === selectedId;
        })
      : -1;
    return {
      chapters: updated,
      currentChapter:
        currentIndex >= 0
          ? currentIndex
          : Math.max(0, Math.min(source.start, updated.length - 1)),
    };
  }
  const remaining = list.slice(0, source.start).concat(list.slice(source.end));
  let adjustedTarget = Number(targetIndex) || 0;
  if (adjustedTarget > source.start)
    adjustedTarget -= source.end - source.start;
  adjustedTarget = Math.max(0, Math.min(adjustedTarget, remaining.length - 1));
  const targetRange = TPP.chapterBlockRange(remaining, adjustedTarget);
  let insertIndex = position === "before" ? targetRange.start : targetRange.end;
  insertIndex = Math.max(0, Math.min(insertIndex, remaining.length));
  const maxRootLevel = TPP.chapterMaxLevelAtInsert(remaining, insertIndex);
  const nextRootLevel = Math.max(
    0,
    Math.min(maxRootLevel, Math.max(0, Number(level) || 0)),
  );
  block.forEach(function (chapter, index) {
    chapter.level = Math.max(
      0,
      Math.min(5, nextRootLevel + levelOffsets[index]),
    );
  });
  remaining.splice(insertIndex, 0, ...block);
  const currentIndex = selectedId
    ? remaining.findIndex(function (chapter) {
        return chapter && chapter.id === selectedId;
      })
    : -1;
  return {
    chapters: remaining,
    currentChapter:
      currentIndex >= 0
        ? currentIndex
        : Math.max(0, Math.min(insertIndex, remaining.length - 1)),
  };
};
TPP.renderChapterSidebar = function () {
  const mount = document.getElementById("chapterSidebarMount");
  if (!mount) return;
  if (TPP.view !== "editor") {
    mount.innerHTML = "";
    mount.hidden = true;
    return;
  }
  mount.hidden = false;
  mount.innerHTML =
    '<section class="chapter-sidebar-panel"><div class="chapter-sidebar-head"><div><h3>Chapters</h3><p>Drag to reorder or indent. Nested chapters move with their parent.</p></div><button id="addChapter" class="primary small">Add</button></div><div id="chapterList" class="chapter-list chapter-sidebar-list"></div></section>';
  TPP.renderChapterList();
};
TPP.chapterOutlineNumber = function (chapters, index) {
  const list = Array.isArray(chapters) ? chapters : [];
  const targetIndex = Math.max(0, Number(index) || 0);
  const counters = [];
  for (let i = 0; i <= targetIndex && i < list.length; i += 1) {
    const level = Math.max(
      0,
      Math.min(5, Number(list[i] && list[i].level) || 0),
    );
    counters[level] = (counters[level] || 0) + 1;
    counters.length = level + 1;
  }
  return counters.join(".");
};
TPP.renderChapterList = function () {
  const list = document.getElementById("chapterList");
  if (!list) return;
  list.innerHTML = TPP.active.chapters
    .map(function (chapter, index) {
      const active = index === TPP.currentChapter;
      const outlineNumber = TPP.chapterOutlineNumber(
        TPP.active.chapters,
        index,
      );
      const badges = [
        chapter && chapter.isMetadata
          ? '<span class="chapter-pill-badge">Meta</span>'
          : "",
        chapter && chapter.includeInToc === false
          ? '<span class="chapter-pill-badge muted">No TOC</span>'
          : "",
      ]
        .filter(Boolean)
        .join("");
      return (
        '<div class="chapter-pill ' +
        (active ? "active " : "") +
        ((chapter.level || 0) > 0 ? "subchapter " : "") +
        '" data-i="' +
        index +
        '" data-level="' +
        (chapter.level || 0) +
        '" draggable="true" style="--level:' +
        (chapter.level || 0) +
        '">' +
        '<span class="indent"></span><div class="chapter-pill-main" data-act="select" role="button" tabindex="0" title="' +
        TPP.esc(chapter.title || "Untitled") +
        '">' +
        '<span class="chapter-pill-index">' +
        TPP.esc(outlineNumber) +
        '.</span><span class="chapter-pill-text"><span class="chapter-pill-title">' +
        TPP.esc(chapter.title || "Untitled") +
        "</span>" +
        (badges
          ? '<span class="chapter-pill-badges">' + badges + "</span>"
          : "") +
        "</span></div></div>"
      );
    })
    .join("");
  TPP.applyChapterDropState();
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
  const chapterSettings = TPP.chapterSettingsInfo(TPP.active);
  if (!chapter) {
    document.getElementById("chapterEditor").innerHTML = "";
    return;
  }
  document.getElementById("chapterEditor").innerHTML =
    '<article class="chapter-card" data-index="' +
    TPP.currentChapter +
    '">' +
    '<div class="toolbar"><button data-main="remove">Remove</button><button data-main="read">Read From Here</button></div>' +
    '<div class="two"><label>Chapter Title <input class="chapter-title" value="' +
    TPP.esc(chapter.title) +
    '"></label>' +
    '<label>TOC Name <input class="chapter-toc-title" placeholder="Optional shorter table of contents name" value="' +
    TPP.esc(chapter.tocTitle || "") +
    '"></label></div>' +
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
    (chapterSettings.imagePlacement === "none" ? "selected" : "") +
    '>No Image</option><option value="below" ' +
    (chapterSettings.imagePlacement === "below" ? "selected" : "") +
    '>Below Title</option><option value="own" ' +
    (chapterSettings.imagePlacement === "own" ? "selected" : "") +
    '>Own Page</option></select></label><label>Image Zoom %<input class="chapter-image-zoom" type="number" min="10" max="100" value="' +
    (chapterSettings.imageZoom || 70) +
    '"></label></div>' +
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
