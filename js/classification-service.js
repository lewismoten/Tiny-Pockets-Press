window.TPP = window.TPP || {};

TPP.classificationCatalog = null;
TPP.classificationExtensionsCatalog = null;
TPP.classificationSearchIndex = [];
TPP.classificationReverseSeeAlsoIndex = {};
TPP.classificationDialogSearchQuery = "";
TPP.classificationDialogSearchActiveIndex = -1;
TPP.classificationDialogTargetEntryId = "";
TPP.classificationDialogPath = [];
TPP.classificationDialogExtensionPath = [];
TPP.classificationDialogSelection = {
  code: "",
  formatId: "",
  extension: "",
};
TPP.classificationExtensionsDataPath = "data/classification-extensions.json";

TPP.defaultClassificationFormatId = function () {
  const system = TPP.classificationSystem();
  const configuredDefault = String(
    (system && system.defaultFormatId) || "",
  ).trim();
  const formats = TPP.classificationFormats();
  if (
    configuredDefault &&
    formats.find(function (entry) {
      return entry && entry.id === configuredDefault;
    })
  ) {
    return configuredDefault;
  }
  const preferred = formats.find(function (entry) {
    return entry && entry.id === "code-short-extension";
  });
  if (preferred && preferred.id) {
    return preferred.id;
  }
  return formats[0] && formats[0].id ? formats[0].id : "code-short-extension";
};
TPP.bookInfoPickerKindLabel = function (kind) {
  return kind === "region" ? "Region" : "Language";
};
TPP.normalizeBookInfoPickerValue = function (kind, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return kind === "region" ? raw.toUpperCase() : raw.toLowerCase();
};
TPP.bookInfoPickerDisplayName = function (kind, value) {
  const normalized = TPP.normalizeBookInfoPickerValue(kind, value);
  if (!normalized) return "";
  const catalog = TPP.bookInfoPickerCatalogs[kind];
  const option =
    Array.isArray(catalog) &&
    catalog.find(function (entry) {
      return entry && entry.value === normalized;
    });
  if (option && option.label) return option.label;
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.DisplayNames === "function"
    ) {
      const locale =
        (typeof navigator !== "undefined" &&
          navigator &&
          ((Array.isArray(navigator.languages) && navigator.languages[0]) ||
            navigator.language)) ||
        "en";
      const displayNames = new Intl.DisplayNames([locale], {
        type: kind === "region" ? "region" : "language",
      });
      return displayNames.of(normalized) || normalized;
    }
  } catch (_error) {}
  return normalized;
};
TPP.bookInfoPickerSummary = function (kind, value) {
  const normalized = TPP.normalizeBookInfoPickerValue(kind, value);
  if (!normalized) {
    return {
      title: "Choose " + TPP.bookInfoPickerKindLabel(kind).toLowerCase(),
      meta:
        "No " + TPP.bookInfoPickerKindLabel(kind).toLowerCase() + " selected",
    };
  }
  return {
    title: TPP.bookInfoPickerDisplayName(kind, normalized) || normalized,
    meta: normalized,
  };
};
TPP.bookInfoPickerCatalogForKind = async function (kind) {
  const targetKind = kind === "region" ? "region" : "language";
  if (Array.isArray(TPP.bookInfoPickerCatalogs[targetKind])) {
    return TPP.bookInfoPickerCatalogs[targetKind];
  }
  const path = TPP.bookInfoPickerDataPaths[targetKind];
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("book-info-picker");
    const data = await response.json();
    const entries =
      data && typeof data === "object" && !Array.isArray(data)
        ? Object.entries(data)
        : [];
    TPP.bookInfoPickerCatalogs[targetKind] = entries
      .map(function (entry) {
        return {
          value: TPP.normalizeBookInfoPickerValue(targetKind, entry[0]),
          label: String(entry[1] || "").trim(),
        };
      })
      .filter(function (entry) {
        return entry.value && entry.label;
      });
  } catch (_error) {
    TPP.bookInfoPickerCatalogs[targetKind] = [];
  }
  return TPP.bookInfoPickerCatalogs[targetKind];
};
TPP.bookInfoPickerResults = function (kind, query, currentValue) {
  const normalizedCurrent = TPP.normalizeBookInfoPickerValue(
    kind,
    currentValue,
  );
  const items = Array.isArray(TPP.bookInfoPickerCatalogs[kind])
    ? TPP.bookInfoPickerCatalogs[kind].slice()
    : [];
  if (
    normalizedCurrent &&
    !items.find(function (entry) {
      return entry && entry.value === normalizedCurrent;
    })
  ) {
    items.unshift({
      value: normalizedCurrent,
      label: TPP.bookInfoPickerDisplayName(kind, normalizedCurrent),
    });
  }
  const text = String(query || "")
    .trim()
    .toLowerCase();
  if (!text) return items.slice(0, 24);
  return items
    .filter(function (entry) {
      const value = String((entry && entry.value) || "").toLowerCase();
      const label = String((entry && entry.label) || "").toLowerCase();
      return value.includes(text) || label.includes(text);
    })
    .slice(0, 24);
};
TPP.defaultClassificationExtensionsCatalog = function () {
  return {
    id: "tiny-shelf",
    name: "",
    classificationId: "tiny-shelf",
    imports: [],
    sharedExtensionTrees: [],
    extensions: [],
  };
};
TPP.cloneClassificationJson = function (value) {
  return JSON.parse(JSON.stringify(value || null));
};
TPP.findClassificationExtensionNode = function (nodes, targetExtension) {
  const target = String(targetExtension || "").trim();
  if (!target) return null;
  let found = null;
  const walk = function (entries) {
    (Array.isArray(entries) ? entries : []).forEach(function (node) {
      if (!node || found) return;
      if (String(node.extension || "").trim() === target) {
        found = node;
        return;
      }
      walk(node.children);
    });
  };
  walk(nodes);
  return found;
};
TPP.expandClassificationExtensionSharedTrees = function (catalog) {
  const expanded =
    TPP.cloneClassificationJson(catalog) ||
    TPP.defaultClassificationExtensionsCatalog();
  const sharedTreeMap = {};
  (Array.isArray(expanded.sharedExtensionTrees)
    ? expanded.sharedExtensionTrees
    : []
  ).forEach(function (definition) {
    const definitionId = String((definition && definition.id) || "").trim();
    if (!definitionId) return;
    sharedTreeMap[definitionId] = TPP.cloneClassificationJson(definition);
  });
  const rebaseSharedChildren = function (nodes, fromPrefix, toPrefix) {
    const sourcePrefix = String(fromPrefix || "").trim();
    const targetPrefix = String(toPrefix || "").trim();
    return (Array.isArray(nodes) ? nodes : []).map(function (node) {
      const rebasedNode = TPP.cloneClassificationJson(node) || {};
      const extensionValue = String(rebasedNode.extension || "").trim();
      if (
        sourcePrefix &&
        targetPrefix &&
        extensionValue &&
        extensionValue.startsWith(sourcePrefix) &&
        sourcePrefix !== targetPrefix
      ) {
        rebasedNode.extension = targetPrefix + "." + extensionValue;
      }
      rebasedNode.children = rebaseSharedChildren(
        rebasedNode.children,
        sourcePrefix,
        targetPrefix,
      );
      return rebasedNode;
    });
  };
  const expandNodes = function (nodes, stack) {
    return (Array.isArray(nodes) ? nodes : []).map(function (node) {
      const expandedNode = TPP.cloneClassificationJson(node) || {};
      const sharedChildrenRef = String(
        expandedNode.sharedChildrenRef || "",
      ).trim();
      const ownChildren = expandNodes(expandedNode.children, stack);
      let sharedChildren = [];
      if (
        sharedChildrenRef &&
        !stack.includes(sharedChildrenRef) &&
        sharedTreeMap[sharedChildrenRef]
      ) {
        const sharedDefinition = sharedTreeMap[sharedChildrenRef];
        const sharedRootExtension = String(
          (sharedDefinition && sharedDefinition.rootExtension) || "",
        ).trim();
        const attachExtension = String(expandedNode.extension || "").trim();
        const definitionChildren = rebaseSharedChildren(
          TPP.cloneClassificationJson(sharedDefinition.children),
          sharedRootExtension,
          attachExtension,
        );
        sharedChildren = expandNodes(
          definitionChildren,
          stack.concat(sharedChildrenRef),
        );
      }
      expandedNode.children = ownChildren.concat(sharedChildren);
      return expandedNode;
    });
  };
  expanded.extensions = (
    Array.isArray(expanded.extensions) ? expanded.extensions : []
  ).map(function (group) {
    const expandedGroup = TPP.cloneClassificationJson(group) || {};
    expandedGroup.children = expandNodes(expandedGroup.children, []);
    return expandedGroup;
  });
  return expanded;
};
TPP.mergeClassificationExtensionsCatalogs = function (baseCatalog, imports) {
  const merged =
    TPP.cloneClassificationJson(baseCatalog) ||
    TPP.defaultClassificationExtensionsCatalog();
  merged.imports = Array.isArray(merged.imports) ? merged.imports : [];
  merged.sharedExtensionTrees = Array.isArray(merged.sharedExtensionTrees)
    ? merged.sharedExtensionTrees
    : [];
  merged.extensions = Array.isArray(merged.extensions) ? merged.extensions : [];
  const appendChildren = function (targetNodes, sourceChildren) {
    const additions = Array.isArray(sourceChildren) ? sourceChildren : [];
    targetNodes.push.apply(
      targetNodes,
      additions.map(function (child) {
        return TPP.cloneClassificationJson(child);
      }),
    );
  };
  (Array.isArray(imports) ? imports : []).forEach(function (catalog) {
    const imported = TPP.cloneClassificationJson(catalog);
    if (!imported || typeof imported !== "object") return;
    const sharedTrees = Array.isArray(imported.sharedExtensionTrees)
      ? imported.sharedExtensionTrees
      : [];
    merged.sharedExtensionTrees.push.apply(
      merged.sharedExtensionTrees,
      sharedTrees.map(function (definition) {
        return TPP.cloneClassificationJson(definition);
      }),
    );
    const groups = Array.isArray(imported.extensions)
      ? imported.extensions
      : [];
    groups.forEach(function (group) {
      if (!group) return;
      const parentCode = String(group.parentCode || "").trim();
      const attachTo = String(group.attachTo || "").trim();
      if (!parentCode) return;
      const existingGroup = merged.extensions.find(function (entry) {
        return entry && String(entry.parentCode || "").trim() === parentCode;
      });
      if (attachTo) {
        if (!existingGroup) return;
        const targetNode = TPP.findClassificationExtensionNode(
          existingGroup.children,
          attachTo,
        );
        if (!targetNode) return;
        targetNode.children = Array.isArray(targetNode.children)
          ? targetNode.children
          : [];
        appendChildren(targetNode.children, group.children);
        return;
      }
      if (!existingGroup) {
        merged.extensions.push(TPP.cloneClassificationJson(group));
        return;
      }
      existingGroup.children = Array.isArray(existingGroup.children)
        ? existingGroup.children
        : [];
      appendChildren(existingGroup.children, group.children);
    });
  });
  return merged;
};
TPP.loadClassificationSystems = async function () {
  if (TPP.classificationCatalog) return TPP.classificationCatalog;
  try {
    const response = await fetch("data/classification-systems.json");
    if (!response.ok) throw new Error("classification");
    TPP.classificationCatalog = await response.json();
  } catch (_error) {
    TPP.classificationCatalog = {
      id: "tiny-shelf",
      name: "",
      categories: [],
    };
  }
  TPP.normalizeClassificationCatalog(TPP.classificationCatalog);
  TPP.buildClassificationSearchIndex();
  TPP.buildClassificationReverseSeeAlsoIndex();
  return TPP.classificationCatalog;
};
TPP.loadClassificationExtensions = async function () {
  if (TPP.classificationExtensionsCatalog) {
    return TPP.classificationExtensionsCatalog;
  }
  try {
    const response = await fetch(TPP.classificationExtensionsDataPath);
    if (!response.ok) throw new Error("classification-extensions");
    const baseCatalog = await response.json();
    const importPaths = Array.isArray(baseCatalog && baseCatalog.imports)
      ? baseCatalog.imports
          .map(function (filePath) {
            return String(filePath || "").trim();
          })
          .filter(Boolean)
      : [];
    const importedCatalogs = await Promise.all(
      importPaths.map(async function (filePath) {
        const importedResponse = await fetch(filePath);
        if (!importedResponse.ok) {
          throw new Error("classification-extensions-import");
        }
        return importedResponse.json();
      }),
    );
    TPP.classificationExtensionsCatalog =
      TPP.expandClassificationExtensionSharedTrees(
        TPP.mergeClassificationExtensionsCatalogs(
          baseCatalog,
          importedCatalogs,
        ),
      );
  } catch (_error) {
    TPP.classificationExtensionsCatalog =
      TPP.defaultClassificationExtensionsCatalog();
  }
  TPP.normalizeClassificationExtensionsCatalog(
    TPP.classificationExtensionsCatalog,
  );
  TPP.buildClassificationSearchIndex();
  TPP.buildClassificationReverseSeeAlsoIndex();
  return TPP.classificationExtensionsCatalog;
};
TPP.defaultClassificationFormats = function () {
  return [
    { id: "code", label: "Code only", template: "{code}" },
    {
      id: "code-short",
      label: "Code + short label",
      template: "{code}-{shortLabel}",
    },
    {
      id: "short-extension",
      label: "Short label + extension",
      template: "{shortLabel}{extensionPart}",
    },
    {
      id: "code-short-extension",
      label: "Code + short + extension",
      template: "{code}-{shortLabel}{extensionPart}",
    },
    {
      id: "code-short-author",
      label: "Code + short + author",
      template: "{code}-{shortLabel} {authorMark}",
    },
    {
      id: "full-shelfmark",
      label: "Full shelfmark",
      template:
        "{code}-{shortLabel}{extensionPart} {authorMark} {year} {languageCountry}",
    },
  ];
};
TPP.classificationShortLabelSeed = function (node) {
  const explicit = String((node && node.shortLabel) || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (explicit) return explicit.slice(0, 4);
  const label = String((node && node.label) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (label.length >= 3) return label.slice(0, 4);
  const code = String((node && node.code) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (label + code + "XXXX").slice(0, 4);
};
TPP.uniqueClassificationShortLabel = function (node, used) {
  const seed = TPP.classificationShortLabelSeed(node);
  const label = String((node && node.label) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const candidates = [seed.slice(0, 3), seed.slice(0, 4)];
  for (let i = 0; i < label.length; i += 1) {
    const candidate = (seed.slice(0, 2) + label.slice(i, i + 2))
      .replace(/[^A-Z]/g, "")
      .padEnd(4, "X")
      .slice(0, 4);
    candidates.push(candidate.slice(0, 3), candidate);
  }
  for (const candidate of candidates) {
    if (candidate && !used.has(candidate)) return candidate;
  }
  const prefix = seed.slice(0, 2) || "X";
  for (let i = 0; i < 676; i += 1) {
    const suffix =
      String.fromCharCode(65 + Math.floor(i / 26)) +
      String.fromCharCode(65 + (i % 26));
    const candidate = (prefix + suffix).slice(0, 4);
    if (!used.has(candidate)) return candidate;
  }
  return ("X" + label + "XXXX").slice(0, 4);
};
TPP.normalizeClassificationCatalog = function (catalog) {
  catalog = catalog && typeof catalog === "object" ? catalog : {};
  const used = new Set();
  const index = {};
  const codeIndex = {};
  const walk = function (nodes, path) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node, position) {
      if (!node) return;
      const nextPath = path.concat(position);
      node.status = String(node.status || "active");
      node.replacedBy = String(node.replacedBy || "");
      node.sort = Number(node.sort || node.code || position);
      node.seeAlso = Array.isArray(node.seeAlso) ? node.seeAlso : [];
      node.seeAlsoExtensions = Array.isArray(node.seeAlsoExtensions)
        ? node.seeAlsoExtensions
        : [];
      node.keywords = Array.isArray(node.keywords) ? node.keywords : [];
      node.includes = Array.isArray(node.includes) ? node.includes : [];
      node.scopeNote = String(node.scopeNote || "");
      node.historyNote = String(node.historyNote || "");
      node.hidden = node.hidden === true;
      node.allowAssign =
        typeof node.allowAssign === "boolean"
          ? node.allowAssign
          : !(Array.isArray(node.children) && node.children.length);
      const shortLabel = TPP.uniqueClassificationShortLabel(node, used);
      used.add(shortLabel);
      node.shortLabel = shortLabel;
      index[shortLabel] = nextPath.slice();
      if (node.code) codeIndex[String(node.code)] = nextPath.slice();
      walk(node.children, nextPath);
    });
  };
  catalog.id = String(catalog.id || "tiny-shelf");
  catalog.version = String(catalog.version || "1.0.0");
  catalog.defaultFormatId = String(catalog.defaultFormatId || "").trim();
  catalog.formats = (
    Array.isArray(catalog.formats) && catalog.formats.length
      ? catalog.formats
      : TPP.defaultClassificationFormats()
  ).map(function (format) {
    const normalized = format && typeof format === "object" ? format : {};
    normalized.id = String(normalized.id || "");
    normalized.label = String(normalized.label || normalized.id);
    normalized.template = String(normalized.template || "{code}");
    normalized.example = String(normalized.example || "");
    normalized.priority = String(normalized.priority || "");
    return normalized;
  });
  catalog.license =
    catalog.license && typeof catalog.license === "object"
      ? catalog.license
      : {};
  catalog.license.name = String(catalog.license.name || "");
  catalog.license.url = String(catalog.license.url || "");
  catalog.license.summary = String(catalog.license.summary || "");
  catalog.profiles = Array.isArray(catalog.profiles)
    ? catalog.profiles.map(function (profile, index) {
        const normalized =
          profile && typeof profile === "object" ? profile : {};
        normalized.id = String(normalized.id || "profile-" + index);
        normalized.label = String(normalized.label || normalized.id);
        normalized.showHiddenCodes = normalized.showHiddenCodes === true;
        normalized.hiddenCodes = Array.isArray(normalized.hiddenCodes)
          ? normalized.hiddenCodes
              .map(function (code) {
                return String(code || "").trim();
              })
              .filter(Boolean)
          : [];
        return normalized;
      })
    : [
        {
          id: "home",
          label: "Home Library",
          showHiddenCodes: false,
          hiddenCodes: ["000"],
        },
      ];
  catalog.rules = Array.isArray(catalog.rules)
    ? catalog.rules.map(function (rule, index) {
        const normalized = rule && typeof rule === "object" ? rule : {};
        normalized.id = String(normalized.id || "rule-" + index);
        normalized.label = String(normalized.label || "");
        normalized.rule = String(normalized.rule || "");
        return normalized;
      })
    : [];
  walk(catalog.categories, []);
  TPP.classificationShortLabelIndex = index;
  TPP.classificationCodeIndex = codeIndex;
  return catalog;
};
TPP.classificationExtensionShortLabelSeed = function (node) {
  const explicit = String((node && node.shortLabel) || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (explicit) return explicit.slice(0, 4);
  const label = String((node && node.label) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (label.length >= 3) return label.slice(0, 4);
  const extension = String((node && node.extension) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (label + extension + "XXXX").slice(0, 4);
};
TPP.uniqueClassificationExtensionShortLabel = function (node, used) {
  const seed = TPP.classificationExtensionShortLabelSeed(node);
  const label = String((node && node.label) || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  const candidates = [seed.slice(0, 3), seed.slice(0, 4)];
  for (let i = 0; i < label.length; i += 1) {
    const candidate = (seed.slice(0, 2) + label.slice(i, i + 2))
      .replace(/[^A-Z]/g, "")
      .padEnd(4, "X")
      .slice(0, 4);
    candidates.push(candidate.slice(0, 3), candidate);
  }
  for (const candidate of candidates) {
    if (candidate && !used.has(candidate)) return candidate;
  }
  const prefix = seed.slice(0, 2) || "X";
  for (let i = 0; i < 676; i += 1) {
    const suffix =
      String.fromCharCode(65 + Math.floor(i / 26)) +
      String.fromCharCode(65 + (i % 26));
    const candidate = (prefix + suffix).slice(0, 4);
    if (!used.has(candidate)) return candidate;
  }
  return ("X" + label + "XXXX").slice(0, 4);
};
TPP.normalizeClassificationExtensionsCatalog = function (catalog) {
  catalog = catalog && typeof catalog === "object" ? catalog : {};
  const shortLabelIndex = {};
  const normalizeTree = function (nodes, used, path, parentCode) {
    return (Array.isArray(nodes) ? nodes : []).map(function (node, position) {
      const normalized = Object.assign({}, node || {});
      const nextPath = path.concat(position);
      normalized.status = String(normalized.status || "active");
      normalized.replacedBy = String(normalized.replacedBy || "");
      const extensionValue = String(normalized.extension || "").replace(
        /[^0-9A-Za-z.]/g,
        "",
      );
      normalized.extension = extensionValue;
      normalized.sort = Number(normalized.sort || extensionValue || position);
      normalized.seeAlso = Array.isArray(normalized.seeAlso)
        ? normalized.seeAlso
        : [];
      normalized.seeAlsoExtensions = Array.isArray(normalized.seeAlsoExtensions)
        ? normalized.seeAlsoExtensions
        : [];
      normalized.keywords = Array.isArray(normalized.keywords)
        ? normalized.keywords
        : [];
      normalized.includes = Array.isArray(normalized.includes)
        ? normalized.includes
        : [];
      normalized.scopeNote = String(normalized.scopeNote || "");
      normalized.historyNote = String(normalized.historyNote || "");
      normalized.hidden = normalized.hidden === true;
      normalized.allowAssign =
        typeof normalized.allowAssign === "boolean"
          ? normalized.allowAssign
          : !(Array.isArray(normalized.children) && normalized.children.length);
      const shortLabel = TPP.uniqueClassificationExtensionShortLabel(
        normalized,
        used,
      );
      used.add(shortLabel);
      normalized.shortLabel = shortLabel;
      if (!shortLabelIndex[parentCode]) shortLabelIndex[parentCode] = {};
      shortLabelIndex[parentCode][shortLabel] = nextPath.slice();
      normalized.children = normalizeTree(
        normalized.children,
        used,
        nextPath,
        parentCode,
      );
      return normalized;
    });
  };
  catalog.id = String(catalog.id || "tiny-shelf");
  catalog.classificationId = String(catalog.classificationId || catalog.id);
  catalog.version = String(catalog.version || "1.0.0");
  catalog.imports = Array.isArray(catalog.imports)
    ? catalog.imports
        .map(function (filePath) {
          return String(filePath || "").trim();
        })
        .filter(Boolean)
    : [];
  catalog.sharedExtensionTrees = Array.isArray(catalog.sharedExtensionTrees)
    ? catalog.sharedExtensionTrees.map(function (definition) {
        const normalizedDefinition =
          definition && typeof definition === "object"
            ? Object.assign({}, definition)
            : {};
        normalizedDefinition.id = String(normalizedDefinition.id || "").trim();
        normalizedDefinition.rootExtension = String(
          normalizedDefinition.rootExtension || "",
        ).trim();
        normalizedDefinition.children = Array.isArray(
          normalizedDefinition.children,
        )
          ? normalizedDefinition.children
          : [];
        return normalizedDefinition;
      })
    : [];
  catalog.extensions = (
    Array.isArray(catalog.extensions) ? catalog.extensions : []
  ).map(function (group) {
    const normalizedGroup = Object.assign({}, group || {});
    normalizedGroup.parentCode = String(
      normalizedGroup.parentCode || "",
    ).trim();
    normalizedGroup.attachTo = String(normalizedGroup.attachTo || "").trim();
    normalizedGroup.children = normalizeTree(
      normalizedGroup.children,
      new Set(),
      [],
      normalizedGroup.parentCode,
    );
    return normalizedGroup;
  });
  TPP.classificationExtensionShortLabelIndex = shortLabelIndex;
  return catalog;
};
TPP.classificationExtensionsSystem = function () {
  return TPP.classificationExtensionsCatalog || null;
};
TPP.classificationExtensionsForCode = function (parentCode) {
  const system = TPP.classificationExtensionsSystem();
  const groups = Array.isArray(system && system.extensions)
    ? system.extensions
    : [];
  const target = String(parentCode || "");
  return (
    groups.find(function (group) {
      return group && group.parentCode === target;
    }) || null
  );
};
TPP.classificationExtensionNode = function (parentCode, extension) {
  const group = TPP.classificationExtensionsForCode(parentCode);
  const target = String(extension || "").trim();
  if (!group || !target) return null;
  let found = null;
  const walk = function (nodes, path) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node, index) {
      if (!node || found) return;
      const nextPath = path.concat(index);
      if (String(node.extension || "") === target) {
        found = { node: node, path: nextPath.slice() };
        return;
      }
      walk(node.children, nextPath);
    });
  };
  walk(group.children, []);
  return found;
};
TPP.classificationExtensionBreadcrumbNodes = function (parentCode, extension) {
  const group = TPP.classificationExtensionsForCode(parentCode);
  const found = TPP.classificationExtensionNode(parentCode, extension);
  if (!group || !found) return [];
  let nodes = Array.isArray(group.children) ? group.children : [];
  return found.path
    .map(function (index) {
      const node = nodes[index] || null;
      nodes = Array.isArray(node && node.children) ? node.children : [];
      return node;
    })
    .filter(Boolean);
};
TPP.classificationExtensionPathForExtension = function (parentCode, extension) {
  const found = TPP.classificationExtensionNode(parentCode, extension);
  return found ? found.path.slice() : [];
};
TPP.classificationExtensionChildren = function (parentCode, path) {
  const group = TPP.classificationExtensionsForCode(parentCode);
  let nodes = Array.isArray(group && group.children) ? group.children : [];
  (Array.isArray(path) ? path : []).forEach(function (index) {
    const node = nodes[index];
    nodes = Array.isArray(node && node.children) ? node.children : [];
  });
  return nodes;
};
TPP.classificationExtensionNodeAtPath = function (parentCode, path) {
  const fullPath = Array.isArray(path) ? path : [];
  if (!fullPath.length) return null;
  const parent = TPP.classificationExtensionChildren(
    parentCode,
    fullPath.slice(0, -1),
  );
  return parent[fullPath[fullPath.length - 1]] || null;
};
TPP.classificationDialogListState = function () {
  const selectedNode = TPP.classificationNodeAtPath(
    TPP.classificationDialogPath,
  );
  const showHidden = TPP.classificationShowHiddenCategories();
  const baseChildren = TPP.classificationNodeChildren(
    TPP.classificationDialogPath,
  ).filter(function (node) {
    return showHidden || !(node && node.hidden);
  });
  if (baseChildren.length) {
    return {
      mode: "base",
      node: selectedNode,
      items: baseChildren,
    };
  }
  if (selectedNode && selectedNode.code) {
    const extensionChildren = TPP.classificationExtensionChildren(
      selectedNode.code,
      TPP.classificationDialogExtensionPath,
    ).filter(function (node) {
      return showHidden || !(node && node.hidden);
    });
    if (extensionChildren.length) {
      return {
        mode: "extension",
        node: selectedNode,
        items: extensionChildren,
      };
    }
  }
  return {
    mode: "base",
    node: selectedNode,
    items: [],
  };
};
TPP.setClassificationDialogCode = function (code, extension) {
  const requestedCode = String(code || "");
  const resolvedPath = TPP.classificationPathForCode(requestedCode);
  const resolvedNode = TPP.classificationNodeAtPath(resolvedPath);
  const nextCode = String(
    (resolvedNode && resolvedNode.code) || requestedCode || "",
  );
  const nextExtension = String(extension || "");
  TPP.classificationDialogSelection.code = nextCode;
  const validExtension =
    nextCode &&
    nextExtension &&
    TPP.classificationExtensionNode(nextCode, nextExtension)
      ? nextExtension
      : "";
  TPP.classificationDialogSelection.extension = validExtension;
  TPP.classificationDialogSelection.formatId = "code-short-extension";
  TPP.classificationDialogExtensionPath = validExtension
    ? TPP.classificationExtensionPathForExtension(nextCode, validExtension)
    : [];
};
TPP.classificationSearchText = function (entry) {
  return [
    entry.fullCode,
    entry.code,
    entry.extension && entry.code ? entry.code + "." + entry.extension : "",
    entry.shortLabel,
    entry.label,
    entry.pathLabel,
    entry.scopeNote,
    ...(entry.keywords || []),
    ...(entry.includes || []),
  ]
    .join(" ")
    .toLowerCase();
};
TPP.classificationFormattedCode = function (code, shortLabel, extension) {
  const base = String(code || "").trim();
  const label = String(shortLabel || "").trim();
  const ext = String(extension || "")
    .trim()
    .replace(/^\.+/, "");
  if (!base && !label) return "";
  return base + (label ? "-" + label : "") + (ext ? "." + ext : "");
};
TPP.classificationProfiles = function () {
  const system = TPP.classificationSystem();
  return Array.isArray(system && system.profiles) ? system.profiles : [];
};
TPP.classificationProfile = function () {
  const profiles = TPP.classificationProfiles();
  const savedId = String(TPP.readSettingsUi().classificationProfileId || "");
  return (
    profiles.find(function (profile) {
      return profile && profile.id === savedId;
    }) ||
    profiles.find(function (profile) {
      return profile && profile.id === "home";
    }) ||
    profiles[0] || { id: "home", label: "Home Library", hiddenCodes: ["000"] }
  );
};
TPP.setClassificationProfile = function (profileId) {
  const state = TPP.readSettingsUi();
  state.classificationProfileId = String(profileId || "home");
  TPP.writeSettingsUi(state);
};
TPP.classificationShowHiddenCategories = function () {
  return TPP.classificationProfile().showHiddenCodes === true;
};
TPP.classificationHiddenCodes = function () {
  return Array.isArray(TPP.classificationProfile().hiddenCodes)
    ? TPP.classificationProfile()
        .hiddenCodes.map(function (code) {
          return String(code || "").trim();
        })
        .filter(Boolean)
    : [];
};
TPP.classificationPathCodes = function (path) {
  return TPP.classificationBreadcrumbNodes(path).map(function (crumb) {
    return String((crumb && crumb.node && crumb.node.code) || "").trim();
  });
};
TPP.classificationPathIsHidden = function (path) {
  if (TPP.classificationShowHiddenCategories()) return false;
  const hiddenCodes = new Set(TPP.classificationHiddenCodes());
  return TPP.classificationBreadcrumbNodes(path).some(function (crumb) {
    return (
      (crumb && crumb.node && crumb.node.hidden) ||
      hiddenCodes.has(
        String((crumb && crumb.node && crumb.node.code) || "").trim(),
      )
    );
  });
};
TPP.classificationEntryIsVisible = function (entry) {
  if (!entry) return false;
  return TPP.classificationShowHiddenCategories() || !entry.hidden;
};
TPP.classificationExtensionOptions = function (parentCode) {
  const baseNode = TPP.classificationNodeAtPath(
    TPP.classificationPathForCode(parentCode),
  );
  const baseShortLabel = TPP.classificationShortLabel(baseNode || {});
  const group = TPP.classificationExtensionsForCode(parentCode);
  const options = [];
  const walk = function (nodes, depth, pathLabels) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (!node) return;
      const nextPath = pathLabels.concat(node.label || "");
      options.push({
        value: String(node.extension || ""),
        label:
          (depth ? "— ".repeat(depth) : "") +
          TPP.classificationFormattedCode(
            parentCode,
            baseShortLabel,
            node.extension,
          ) +
          " " +
          String(node.label || ""),
        pathLabel: nextPath.join(" > "),
      });
      walk(node.children, depth + 1, nextPath);
    });
  };
  walk(group && group.children, 0, []);
  return options;
};
TPP.buildClassificationSearchIndex = function () {
  const baseSystem = TPP.classificationSystem();
  const extensionSystem = TPP.classificationExtensionsSystem();
  if (!baseSystem) {
    TPP.classificationSearchIndex = [];
    return [];
  }
  const entries = [];
  const walkBase = function (nodes, pathLabels, hidden) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (!node) return;
      const nextLabels = pathLabels.concat(node.label || "");
      const isHidden = hidden || !!node.hidden;
      entries.push({
        kind: "base",
        code: String(node.code || ""),
        extension: "",
        fullCode: String(node.code || ""),
        baseShortLabel: TPP.classificationShortLabel(node),
        shortLabel: TPP.classificationShortLabel(node),
        label: String(node.label || ""),
        pathLabel: pathLabels.join(" > "),
        keywords: Array.isArray(node.keywords) ? node.keywords : [],
        includes: Array.isArray(node.includes) ? node.includes : [],
        scopeNote: String(node.scopeNote || ""),
        allowAssign: !!node.allowAssign,
        hidden: isHidden,
      });
      walkBase(node.children, nextLabels, isHidden);
    });
  };
  const walkExtension = function (parentCode, nodes, pathLabels, basePath) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (!node) return;
      const nextLabels = pathLabels.concat(node.label || "");
      const baseNode =
        TPP.classificationNodeAtPath(
          TPP.classificationPathForCode(parentCode),
        ) || {};
      const basePathValue = TPP.classificationPathForCode(parentCode);
      entries.push({
        kind: "extension",
        code: String(parentCode || ""),
        extension: String(node.extension || ""),
        fullCode: String(parentCode || "") + "." + String(node.extension || ""),
        baseShortLabel: TPP.classificationShortLabel(baseNode) || "",
        shortLabel: TPP.classificationShortLabel(node),
        label: String(node.label || ""),
        pathLabel: basePath.concat(pathLabels).join(" > "),
        keywords: Array.isArray(node.keywords) ? node.keywords : [],
        includes: Array.isArray(node.includes) ? node.includes : [],
        scopeNote: String(node.scopeNote || ""),
        allowAssign: !!node.allowAssign,
        hidden: TPP.classificationPathIsHidden(basePathValue) || !!node.hidden,
      });
      walkExtension(parentCode, node.children, nextLabels, basePath);
    });
  };
  walkBase(baseSystem.categories, [], false);
  (Array.isArray(extensionSystem && extensionSystem.extensions)
    ? extensionSystem.extensions
    : []
  ).forEach(function (group) {
    if (!group || !group.parentCode) return;
    const basePath = TPP.classificationBreadcrumbNodes(
      TPP.classificationPathForCode(group.parentCode),
    ).map(function (crumb) {
      return crumb.node.label;
    });
    walkExtension(group.parentCode, group.children, [], basePath);
  });
  entries.forEach(function (entry) {
    entry.searchText = TPP.classificationSearchText(entry);
  });
  TPP.classificationSearchIndex = entries;
  return entries;
};
TPP.buildClassificationReverseSeeAlsoIndex = function () {
  const reverse = {};
  const addReverse = function (fromRef, toRef) {
    const source = String(fromRef || "").trim();
    const target = String(toRef || "").trim();
    if (!source || !target) return;
    if (!reverse[target]) reverse[target] = [];
    if (!reverse[target].includes(source)) reverse[target].push(source);
  };
  const walkBase = function (nodes) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (!node || !node.code) return;
      const sourceRef = String(node.code);
      (Array.isArray(node.seeAlso) ? node.seeAlso : [])
        .concat(
          Array.isArray(node.seeAlsoExtensions) ? node.seeAlsoExtensions : [],
        )
        .forEach(function (ref) {
          addReverse(sourceRef, ref);
        });
      walkBase(node.children);
    });
  };
  const walkExtension = function (parentCode, nodes) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
      if (!node || !node.extension) return;
      const sourceRef = String(parentCode) + "." + String(node.extension);
      (Array.isArray(node.seeAlso) ? node.seeAlso : [])
        .concat(
          Array.isArray(node.seeAlsoExtensions) ? node.seeAlsoExtensions : [],
        )
        .forEach(function (ref) {
          addReverse(sourceRef, ref);
        });
      walkExtension(parentCode, node.children);
    });
  };
  const system = TPP.classificationSystem();
  const extensionSystem = TPP.classificationExtensionsSystem();
  walkBase(system && system.categories);
  (Array.isArray(extensionSystem && extensionSystem.extensions)
    ? extensionSystem.extensions
    : []
  ).forEach(function (group) {
    if (!group || !group.parentCode) return;
    walkExtension(group.parentCode, group.children);
  });
  TPP.classificationReverseSeeAlsoIndex = reverse;
  return reverse;
};
TPP.searchClassificationIndex = function (query, limit) {
  const text = String(query || "")
    .trim()
    .toLowerCase();
  if (!text) return [];
  const tokens = text.split(/\s+/).filter(Boolean);
  return (TPP.classificationSearchIndex || [])
    .map(function (entry) {
      let score = 0;
      if (entry.fullCode.toLowerCase() === text) score += 500;
      else if (entry.fullCode.toLowerCase().startsWith(text)) score += 300;
      if (entry.code.toLowerCase() === text) score += 260;
      if (entry.shortLabel.toLowerCase() === text) score += 240;
      if (entry.label.toLowerCase() === text) score += 220;
      if (entry.label.toLowerCase().startsWith(text)) score += 180;
      if (entry.pathLabel.toLowerCase().includes(text)) score += 100;
      tokens.forEach(function (token) {
        if (entry.searchText.includes(token)) score += 30;
        if (entry.label.toLowerCase().includes(token)) score += 35;
        if (entry.shortLabel.toLowerCase().includes(token)) score += 25;
      });
      return { entry: entry, score: score };
    })
    .filter(function (item) {
      return item.score > 0 && TPP.classificationEntryIsVisible(item.entry);
    })
    .sort(function (a, b) {
      return (
        b.score - a.score ||
        a.entry.fullCode.localeCompare(b.entry.fullCode) ||
        a.entry.label.localeCompare(b.entry.label)
      );
    })
    .slice(0, limit || 8)
    .map(function (item) {
      return item.entry;
    });
};
TPP.renderClassificationSearchResults = function (results, activeIndex) {
  const list = document.getElementById("classificationDialogSearchResults");
  if (!list) return;
  if (!results.length) {
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  list.hidden = false;
  list.innerHTML = results
    .map(function (entry, index) {
      return (
        '<button type="button" class="classification-dialog-search-result' +
        (index === activeIndex ? " is-active" : "") +
        '" data-classification-search-select="' +
        TPP.esc(
          JSON.stringify({
            code: entry.code,
            extension: entry.extension,
            kind: entry.kind,
          }),
        ) +
        '">' +
        '<span class="classification-dialog-search-result-code">' +
        TPP.esc(
          TPP.classificationFormattedCode(
            entry.code,
            entry.baseShortLabel || entry.shortLabel,
            entry.extension,
          ),
        ) +
        '</span><span class="classification-dialog-search-result-main">' +
        '<span class="classification-dialog-search-result-label">' +
        TPP.esc(entry.label) +
        "</span>" +
        (entry.pathLabel
          ? '<span class="classification-dialog-search-result-meta">' +
            TPP.esc(entry.pathLabel) +
            "</span>"
          : "") +
        "</span></button>"
      );
    })
    .join("");
};
TPP.closeClassificationSearchResults = function () {
  const list = document.getElementById("classificationDialogSearchResults");
  if (!list) return;
  list.hidden = true;
  list.innerHTML = "";
  TPP.classificationDialogSearchActiveIndex = -1;
};
TPP.applyClassificationSearchSelection = function (selection) {
  const code = String((selection && selection.code) || "");
  const extension = String((selection && selection.extension) || "");
  TPP.setClassificationDialogCode(code, extension);
  TPP.classificationDialogSelection.formatId = extension
    ? "code-short-extension"
    : TPP.defaultClassificationFormatId();
  TPP.classificationDialogPath = code
    ? TPP.classificationPathForCode(code)
    : [];
  TPP.classificationDialogSearchQuery = "";
  TPP.closeClassificationSearchResults();
  TPP.renderClassificationDialog();
};
TPP.classificationReferenceDetails = function (reference) {
  const raw = String(reference || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{3})(?:\.([0-9A-Za-z]+))?$/);
  const baseRef = match ? match[1] : raw;
  const extensionRef = match ? String(match[2] || "") : "";
  const basePath = TPP.classificationPathForCode(baseRef);
  const baseNode = TPP.classificationNodeAtPath(basePath);
  if (!baseNode || !baseNode.code) return null;
  const baseBreadcrumb = TPP.classificationBreadcrumbNodes(basePath).map(
    function (crumb) {
      return crumb.node.label;
    },
  );
  if (extensionRef) {
    const extensionFound = TPP.classificationExtensionNode(
      baseNode.code,
      extensionRef,
    );
    if (!extensionFound || !extensionFound.node) return null;
    const extensionBreadcrumb = TPP.classificationExtensionBreadcrumbNodes(
      baseNode.code,
      extensionRef,
    );
    return {
      raw: raw,
      code: baseNode.code,
      extension: extensionRef,
      shortLabel:
        TPP.classificationShortLabel(baseNode) +
        "." +
        TPP.classificationShortLabel(extensionFound.node),
      displayCode: TPP.classificationFormattedCode(
        baseNode.code,
        TPP.classificationShortLabel(baseNode),
        extensionRef,
      ),
      label: String(extensionFound.node.label || ""),
      pathLabel: baseBreadcrumb
        .concat(
          extensionBreadcrumb.map(function (node) {
            return node.label;
          }),
        )
        .join(" > "),
      scopeNote: String(extensionFound.node.scopeNote || ""),
      hidden:
        TPP.classificationPathIsHidden(basePath) ||
        !!extensionFound.node.hidden,
    };
  }
  return {
    raw: raw,
    code: baseNode.code,
    extension: "",
    shortLabel: TPP.classificationShortLabel(baseNode),
    displayCode: TPP.classificationFormattedCode(
      baseNode.code,
      TPP.classificationShortLabel(baseNode),
      "",
    ),
    label: String(baseNode.label || ""),
    pathLabel: baseBreadcrumb.join(" > "),
    scopeNote: String(baseNode.scopeNote || ""),
    hidden: TPP.classificationPathIsHidden(basePath),
  };
};
TPP.renderClassificationSeeAlso = function (node, currentReference) {
  const currentRef = String(currentReference || "").trim();
  const reverseRefs =
    (currentRef && TPP.classificationReverseSeeAlsoIndex[currentRef]) || [];
  const refs = (Array.isArray(node && node.seeAlso) ? node.seeAlso : [])
    .concat(
      Array.isArray(node && node.seeAlsoExtensions)
        ? node.seeAlsoExtensions
        : [],
    )
    .concat(reverseRefs)
    .map(function (value) {
      return String(value || "").trim();
    })
    .filter(Boolean)
    .filter(function (value, index, values) {
      return values.indexOf(value) === index;
    })
    .map(TPP.classificationReferenceDetails)
    .filter(TPP.classificationEntryIsVisible)
    .filter(Boolean);
  if (!refs.length) return "";
  return (
    '<div class="classification-see-also"><div class="small"><strong>See also</strong></div><div class="classification-see-also-list">' +
    refs
      .map(function (ref) {
        return (
          '<div class="classification-see-also-item"><button type="button" class="classification-see-also-link" data-classification-related="' +
          TPP.esc(
            JSON.stringify({
              code: ref.code,
              extension: ref.extension,
            }),
          ) +
          '">' +
          TPP.esc(ref.displayCode) +
          '</button><div class="classification-see-also-meta">' +
          TPP.esc(ref.pathLabel) +
          "</div></div>"
        );
      })
      .join("") +
    "</div></div>"
  );
};
TPP.classificationSystem = function () {
  return TPP.classificationCatalog || null;
};
TPP.classificationFormats = function () {
  const system = TPP.classificationSystem();
  return Array.isArray(system && system.formats) && system.formats.length
    ? system.formats
    : TPP.defaultClassificationFormats();
};
TPP.classificationNodeChildren = function (path) {
  const system = TPP.classificationSystem();
  let nodes = Array.isArray(system && system.categories)
    ? system.categories
    : [];
  (Array.isArray(path) ? path : []).forEach(function (index) {
    const node = nodes[index];
    nodes = Array.isArray(node && node.children) ? node.children : [];
  });
  return nodes;
};
TPP.classificationNodeAtPath = function (path) {
  const fullPath = Array.isArray(path) ? path : [];
  if (!fullPath.length) return null;
  const parent = TPP.classificationNodeChildren(fullPath.slice(0, -1));
  return parent[fullPath[fullPath.length - 1]] || null;
};
TPP.classificationBreadcrumbNodes = function (path) {
  const crumbs = [];
  (Array.isArray(path) ? path : []).forEach(function (_unused, index) {
    const crumbPath = path.slice(0, index + 1);
    const node = TPP.classificationNodeAtPath(crumbPath);
    if (node) crumbs.push({ path: crumbPath, node: node });
  });
  return crumbs;
};
TPP.classificationPathForShortLabel = function (shortLabel) {
  const key = String(shortLabel || "")
    .trim()
    .toUpperCase();
  return TPP.classificationShortLabelIndex &&
    TPP.classificationShortLabelIndex[key]
    ? TPP.classificationShortLabelIndex[key].slice()
    : [];
};
TPP.classificationShortLabel = function (node) {
  const explicit = String((node && node.shortLabel) || "").trim();
  if (explicit) return explicit;
  return String((node && node.label) || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase();
};
TPP.classificationPathForCode = function (code) {
  const target = String(code || "").trim();
  if (!target) return [];
  if (TPP.classificationCodeIndex && TPP.classificationCodeIndex[target]) {
    return TPP.classificationCodeIndex[target].slice();
  }
  const system = TPP.classificationSystem();
  let found = [];
  const walk = function (nodes, path) {
    (Array.isArray(nodes) ? nodes : []).forEach(function (node, index) {
      if (!node || found.length) return;
      const nextPath = path.concat(index);
      if (node.code === target) {
        found = nextPath;
        return;
      }
      walk(node.children, nextPath);
    });
  };
  walk(system && system.categories, []);
  return found;
};
TPP.classificationPathForData = function (data) {
  const code = String((data && data.code) || "").trim();
  const shortLabel = String((data && data.shortLabel) || "")
    .trim()
    .toUpperCase();
  const codePath = code ? TPP.classificationPathForCode(code) : [];
  if (!shortLabel || !codePath.length) {
    return shortLabel
      ? TPP.classificationPathForShortLabel(shortLabel)
      : codePath;
  }
  const shortLabelPath = TPP.classificationPathForShortLabel(shortLabel);
  const codeNode = TPP.classificationNodeAtPath(codePath);
  if (
    codeNode &&
    TPP.classificationShortLabel(codeNode).toUpperCase() === shortLabel
  ) {
    return codePath;
  }
  return shortLabelPath.length ? shortLabelPath : codePath;
};
TPP.classificationValueData = function (value) {
  const raw = String(value || "").trim();
  if (!raw)
    return {
      code: "",
      shortLabel: "",
      formatId: TPP.defaultClassificationFormatId(),
      extension: "",
      title: "",
      meta: "",
    };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        code: String(parsed.code || ""),
        shortLabel: String(parsed.shortLabel || ""),
        formatId: String(
          parsed.formatId || TPP.defaultClassificationFormatId(),
        ),
        extension: String(parsed.extension || ""),
        title: String(parsed.title || ""),
        meta: String(parsed.meta || ""),
      };
    }
  } catch (_error) {}
  return {
    code: raw,
    shortLabel: "",
    formatId: TPP.defaultClassificationFormatId(),
    extension: "",
    title: "",
    meta: "",
  };
};
TPP.classificationStorageValue = function (payload) {
  const data = {
    code: String((payload && payload.code) || ""),
    shortLabel: String((payload && payload.shortLabel) || ""),
    formatId: String(
      (payload && payload.formatId) || TPP.defaultClassificationFormatId(),
    ),
    extension: String((payload && payload.extension) || ""),
    title: String((payload && payload.title) || ""),
    meta: String((payload && payload.meta) || ""),
  };
  if (!data.code && !data.shortLabel) return "";
  return JSON.stringify(data);
};
TPP.classificationAuthorMark = function (book) {
  const author = String(TPP.bookInfoValue(book, "author") || "").trim();
  if (!author) return "";
  const source = author.split(/\s+/).filter(Boolean).slice(-1)[0] || author;
  const letters = source.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return letters ? (letters + "XXX").slice(0, 3) : "";
};
TPP.classificationYear = function (book) {
  const pubDate = String(TPP.bookInfoValue(book, "pubDate") || "").trim();
  return /^\d{4}/.test(pubDate) ? pubDate.slice(0, 4) : "";
};
TPP.classificationLanguageCountry = function (book) {
  const language = TPP.normalizeBookInfoPickerValue(
    "language",
    TPP.bookInfoValue(book, "language"),
  );
  const region = TPP.normalizeBookInfoPickerValue(
    "region",
    TPP.bookInfoValue(book, "region"),
  );
  if (language && region) return language + "-" + region;
  return language || region;
};
TPP.cachedClassificationResolution = function (book, entryId, value) {
  if (!book || !entryId || !TPP.bookInfoEntryById) return null;
  const entry = TPP.bookInfoEntryById(book, entryId);
  if (!entry || entry.key !== "classification") return null;
  const data = TPP.classificationValueData(value);
  return {
    title: String(data.title || ""),
    meta: String(data.meta || ""),
  };
};
TPP.setCachedClassificationResolution = function (
  book,
  entryId,
  value,
  summary,
) {
  if (!book || !entryId || !TPP.bookInfoEntryById) return;
  const entry = TPP.bookInfoEntryById(book, entryId);
  if (!entry || entry.key !== "classification") return;
  entry.customLabel = "";
  if (!String(value || "").trim()) {
    entry.value = "";
    return;
  }
  entry.value = TPP.classificationStorageValue(
    Object.assign({}, TPP.classificationValueData(value), {
      title: String((summary && summary.title) || ""),
      meta: String((summary && summary.meta) || ""),
    }),
  );
};
TPP.classificationFallbackDisplayString = function (book, value) {
  const data =
    typeof value === "string" ? TPP.classificationValueData(value) : value;
  if (!data || (!data.code && !data.shortLabel)) return "";
  const code = String(data.code || "").trim();
  const shortLabel = String(data.shortLabel || "").trim();
  const extension = String(data.extension || "").replace(/^\.+/, "");
  if (code && shortLabel) {
    return code + "-" + shortLabel + (extension ? "." + extension : "");
  }
  return code || shortLabel;
};
TPP.classificationNodeForData = function (data) {
  const path = TPP.classificationPathForData(data);
  return path.length ? TPP.classificationNodeAtPath(path) : null;
};
TPP.classificationDisplayString = function (book, value) {
  const data =
    typeof value === "string" ? TPP.classificationValueData(value) : value;
  const node =
    TPP.classificationNodeForData(data) ||
    (data && (data.code || data.shortLabel)
      ? {
          code: data.code,
          shortLabel: data.shortLabel || data.code,
        }
      : null);
  if (!node) {
    return TPP.classificationFallbackDisplayString(book, data);
  }
  const format =
    TPP.classificationFormats().find(function (entry) {
      return entry && entry.id === data.formatId;
    }) ||
    TPP.classificationFormats().find(function (entry) {
      return entry && entry.id === TPP.defaultClassificationFormatId();
    }) ||
    TPP.classificationFormats()[0];
  const extension = String((data && data.extension) || "").replace(/^\.+/, "");
  const tokens = {
    code: String(node.code || ""),
    shortLabel: TPP.classificationShortLabel(node),
    extension: extension,
    extensionPart: extension ? "." + extension : "",
    authorMark: TPP.classificationAuthorMark(book),
    year: TPP.classificationYear(book),
    languageCountry: TPP.classificationLanguageCountry(book),
  };
  return String((format && format.template) || "{code}-{shortLabel}")
    .replace(/\{([A-Za-z0-9]+)\}/g, function (_full, key) {
      return tokens[key] || "";
    })
    .replace(/\s+/g, " ")
    .trim();
};
TPP.computeClassificationSummary = function (value) {
  const data = TPP.classificationValueData(value);
  if (!data.code && !data.shortLabel)
    return {
      title: "Choose classification",
      meta: "No classification selected",
    };
  const system = TPP.classificationSystem();
  const found = [];
  const sourcePath = TPP.classificationPathForData(data);
  if (sourcePath.length) {
    found.push(
      TPP.classificationBreadcrumbNodes(sourcePath).map(function (crumb) {
        return crumb.node;
      }),
    );
  }
  if (found.length) {
    const nodes = found[0];
    const extensionNodes =
      data.code && data.extension
        ? TPP.classificationExtensionBreadcrumbNodes(data.code, data.extension)
        : [];
    const shortPath = nodes
      .map(function (node) {
        return TPP.classificationShortLabel(node);
      })
      .join("/");
    const extensionPath = extensionNodes
      .map(function (node) {
        return node.label;
      })
      .join(" > ");
    const fullPath =
      nodes
        .map(function (node) {
          return node.label;
        })
        .join(" > ") + (extensionPath ? " > " + extensionPath : "");
    return {
      title: TPP.classificationDisplayString(TPP.active, data),
      meta: fullPath + (shortPath ? " [" + shortPath + "]" : ""),
    };
  }
  return {
    title: TPP.classificationDisplayString(TPP.active, data) || data.code,
    meta: "Custom or unknown shelfmark",
  };
};
TPP.classificationSummary = function (value, options) {
  const settings = options && typeof options === "object" ? options : {};
  const book = settings.book || TPP.active || null;
  const entryId = String(settings.entryId || "").trim();
  const data = TPP.classificationValueData(value);
  if (!data.code && !data.shortLabel) {
    return {
      title: "Choose classification",
      meta: "No classification selected",
    };
  }
  const cached = TPP.cachedClassificationResolution(book, entryId, value);
  if (cached && (cached.title || cached.meta)) {
    return {
      title: String(cached.title || "") || "Choose classification",
      meta:
        String(cached.meta || "") || "Open classification picker for full path",
    };
  }
  if (TPP.classificationCatalog && TPP.classificationExtensionsCatalog) {
    return TPP.computeClassificationSummary(value);
  }
  return {
    title: TPP.classificationFallbackDisplayString(book, data) || data.code,
    meta: "Open classification picker for full path",
  };
};
TPP.renderClassificationDialog = function () {
  const system = TPP.classificationSystem();
  const title = document.getElementById("classificationDialogTitle");
  const description = document.getElementById(
    "classificationDialogDescription",
  );
  const meta = document.getElementById("classificationDialogMeta");
  const breadcrumbs = document.getElementById("classificationBreadcrumbs");
  const searchInput = document.getElementById("classificationDialogSearch");
  const profileSelect = document.getElementById("classificationDialogProfile");
  const selection = document.getElementById("classificationSelection");
  const list = document.getElementById("classificationDialogList");
  if (title) title.textContent = (system && system.name) || "Classification";
  if (description)
    description.textContent =
      (system && system.description ? system.description : "") ||
      "Choose a shelfmark by drilling into categories.";
  if (meta) {
    const license = (system && system.license) || {};
    meta.innerHTML =
      (system && system.version
        ? "<div><strong>Version:</strong> " + TPP.esc(system.version) + "</div>"
        : "") +
      (license.name
        ? "<div><strong>License:</strong> " +
          (license.url
            ? '<a href="' +
              TPP.esc(license.url) +
              '" target="_blank" rel="noreferrer">' +
              TPP.esc(license.name) +
              "</a>"
            : TPP.esc(license.name)) +
          (license.summary ? " — " + TPP.esc(license.summary) : "") +
          "</div>"
        : "");
  }
  if (searchInput) {
    searchInput.value = TPP.classificationDialogSearchQuery || "";
  }
  if (profileSelect) {
    const profiles = TPP.classificationProfiles();
    const currentProfile = TPP.classificationProfile();
    profileSelect.innerHTML = profiles
      .map(function (profile) {
        return (
          '<option value="' +
          TPP.esc(profile.id) +
          '"' +
          (currentProfile && currentProfile.id === profile.id
            ? " selected"
            : "") +
          ">" +
          TPP.esc(profile.label || profile.id) +
          "</option>"
        );
      })
      .join("");
  }
  if (breadcrumbs) {
    const crumbs = TPP.classificationBreadcrumbNodes(
      TPP.classificationDialogPath,
    );
    const selectedNode = TPP.classificationNodeAtPath(
      TPP.classificationDialogPath,
    );
    const extensionCrumbs =
      selectedNode &&
      selectedNode.code &&
      TPP.classificationDialogSelection.extension
        ? TPP.classificationExtensionBreadcrumbNodes(
            selectedNode.code,
            TPP.classificationDialogSelection.extension,
          )
        : [];
    breadcrumbs.innerHTML =
      '<button type="button" class="classification-crumb' +
      (crumbs.length ? "" : " is-active") +
      '" data-classification-crumb="">Top</button>' +
      crumbs
        .map(function (crumb) {
          return (
            '<span class="classification-crumb-sep">/</span><button type="button" class="classification-crumb is-active' +
            (crumb.node && crumb.node.hidden
              ? " classification-crumb-hidden"
              : "") +
            '" data-classification-crumb="' +
            TPP.esc(JSON.stringify(crumb.path)) +
            '">' +
            TPP.esc(crumb.node.label) +
            "</button>"
          );
        })
        .concat(
          extensionCrumbs.map(function (crumb, index) {
            return (
              '<span class="classification-crumb-sep">/</span><button type="button" class="classification-crumb classification-crumb-extension is-active" data-classification-extension-crumb="' +
              TPP.esc(
                JSON.stringify(
                  TPP.classificationDialogExtensionPath.slice(0, index + 1),
                ),
              ) +
              '">' +
              TPP.esc(crumb.label) +
              "</button>"
            );
          }),
        )
        .join("");
  }
  const selectedNode = TPP.classificationNodeAtPath(
    TPP.classificationDialogPath,
  );
  if (selection) {
    if (selectedNode && selectedNode.code) {
      const extensionGroup = TPP.classificationExtensionsForCode(
        selectedNode.code,
      );
      const canAssign =
        !!selectedNode.allowAssign ||
        !(Array.isArray(selectedNode.children) && selectedNode.children.length);
      const preview = TPP.classificationDisplayString(TPP.active, {
        code: selectedNode.code,
        shortLabel: TPP.classificationShortLabel(selectedNode),
        formatId:
          TPP.classificationDialogSelection.formatId ||
          TPP.defaultClassificationFormatId(),
        extension: TPP.classificationDialogSelection.extension || "",
      });
      const selectedExtensionNode =
        TPP.classificationDialogSelection.extension &&
        TPP.classificationExtensionNode(
          selectedNode.code,
          TPP.classificationDialogSelection.extension,
        )
          ? TPP.classificationExtensionNode(
              selectedNode.code,
              TPP.classificationDialogSelection.extension,
            ).node
          : null;
      const currentReferenceNode = selectedExtensionNode || selectedNode;
      const currentPath = TPP.classificationBreadcrumbNodes(
        TPP.classificationDialogPath,
      )
        .map(function (crumb) {
          return crumb.node.label;
        })
        .concat(
          selectedExtensionNode
            ? TPP.classificationExtensionBreadcrumbNodes(
                selectedNode.code,
                TPP.classificationDialogSelection.extension,
              ).map(function (node) {
                return node.label;
              })
            : [],
        )
        .join(" > ");
      const currentScopeNote = String(
        (currentReferenceNode && currentReferenceNode.scopeNote) || "",
      );
      const currentReference =
        selectedExtensionNode && TPP.classificationDialogSelection.extension
          ? selectedNode.code +
            "." +
            TPP.classificationDialogSelection.extension
          : selectedNode.code;
      const seeAlsoMarkup = TPP.renderClassificationSeeAlso(
        currentReferenceNode,
        currentReference,
      );
      selection.hidden = false;
      selection.innerHTML =
        '<div class="classification-selection-main"><strong>' +
        TPP.esc(preview || selectedNode.code) +
        "</strong>" +
        (currentPath
          ? '<div class="small">' + TPP.esc(currentPath) + "</div>"
          : "") +
        (currentScopeNote
          ? '<div class="small">' + TPP.esc(currentScopeNote) + "</div>"
          : "") +
        (TPP.classificationPathIsHidden(TPP.classificationDialogPath)
          ? '<div class="small classification-hidden-note">Hidden category. Intended for library-internal or special-use shelving.</div>'
          : "") +
        seeAlsoMarkup +
        '</div><div class="classification-selection-controls">' +
        (extensionGroup
          ? '<div class="small">Extensions appear below in deeper categories.</div>'
          : "") +
        '<div class="toolbar">' +
        (canAssign
          ? '<button type="button" class="primary" data-classification-select="' +
            TPP.esc(selectedNode.code) +
            '">Use This Shelfmark</button>'
          : "") +
        '<button type="button" data-classification-clear="1">Clear</button></div>';
    } else {
      selection.hidden = true;
      selection.innerHTML = "";
    }
  }
  if (list) {
    const listState = TPP.classificationDialogListState();
    list.innerHTML = listState.items.length
      ? listState.items
          .map(function (node, index) {
            if (listState.mode === "extension") {
              const nextPath =
                TPP.classificationDialogExtensionPath.concat(index);
              return (
                '<div class="classification-option is-openable" data-classification-extension-open="' +
                TPP.esc(JSON.stringify(nextPath)) +
                '"' +
                "><div><strong>" +
                TPP.esc(
                  TPP.classificationFormattedCode(
                    listState.node.code,
                    TPP.classificationShortLabel(listState.node),
                    node.extension,
                  ),
                ) +
                '</strong> <span class="classification-short-label">' +
                TPP.esc(TPP.classificationShortLabel(node)) +
                "</span> " +
                TPP.esc(node.label || "") +
                '</div><div class="toolbar"></div></div>'
              );
            }
            const nextPath = TPP.classificationDialogPath.concat(index);
            return (
              '<div class="classification-option is-openable" data-classification-open="' +
              TPP.esc(JSON.stringify(nextPath)) +
              '"' +
              "><div><strong>" +
              TPP.esc(node.code || "") +
              '</strong> <span class="classification-short-label">' +
              TPP.esc(TPP.classificationShortLabel(node)) +
              "</span> " +
              TPP.esc(node.label || "") +
              '</div><div class="toolbar"></div></div>'
            );
          })
          .join("")
      : '<div class="front-cover-field-empty">No deeper categories here.</div>';
  }
  TPP.renderClassificationSearchResults(
    TPP.searchClassificationIndex(TPP.classificationDialogSearchQuery, 8),
    TPP.classificationDialogSearchActiveIndex,
  );
};
TPP.openClassificationDialog = async function (entryId) {
  if (typeof TPP.ensureControlModule === "function") {
    await TPP.ensureControlModule("classification-dialog");
  }
  const dialog = document.getElementById("classificationDialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  await TPP.loadClassificationSystems();
  await TPP.loadClassificationExtensions();
  TPP.classificationDialogTargetEntryId = entryId || "";
  const row = document.querySelector(
    '.book-info-entry[data-entry-id="' +
      TPP.classificationDialogTargetEntryId +
      '"]',
  );
  const currentValue = row && row.querySelector(".book-info-value");
  const currentData = TPP.classificationValueData(
    currentValue && currentValue.value,
  );
  TPP.classificationDialogSelection = {
    code: "",
    formatId: currentData.formatId || TPP.defaultClassificationFormatId(),
    extension: "",
  };
  TPP.classificationDialogSearchQuery = "";
  TPP.classificationDialogSearchActiveIndex = -1;
  TPP.classificationDialogPath = TPP.classificationPathForData(currentData);
  const resolvedNode = TPP.classificationNodeAtPath(
    TPP.classificationDialogPath,
  );
  TPP.setClassificationDialogCode(
    (resolvedNode && resolvedNode.code) || currentData.code || "",
    currentData.extension || "",
  );
  TPP.renderClassificationDialog();
  if (!dialog.open) dialog.showModal();
  const searchInput = document.getElementById("classificationDialogSearch");
  if (searchInput) {
    window.setTimeout(function () {
      searchInput.focus();
      searchInput.select();
    }, 0);
  }
};
TPP.applyClassificationValue = function () {
  const row = document.querySelector(
    '.book-info-entry[data-entry-id="' +
      TPP.classificationDialogTargetEntryId +
      '"]',
  );
  const input = row && row.querySelector(".book-info-value");
  if (!input) return;
  const selectedNode = TPP.classificationNodeAtPath(
    TPP.classificationDialogPath,
  );
  const rawValue = selectedNode
    ? TPP.classificationStorageValue({
        code: selectedNode.code,
        shortLabel: TPP.classificationShortLabel(selectedNode),
        formatId:
          TPP.classificationDialogSelection.formatId ||
          TPP.defaultClassificationFormatId(),
        extension: TPP.classificationDialogSelection.extension || "",
      })
    : "";
  const summary = selectedNode
    ? TPP.computeClassificationSummary(rawValue)
    : null;
  TPP.setCachedClassificationResolution(
    TPP.active,
    TPP.classificationDialogTargetEntryId,
    rawValue,
    summary,
  );
  const entry = TPP.bookInfoEntryById(
    TPP.active,
    TPP.classificationDialogTargetEntryId,
  );
  input.value = entry ? String(entry.value || "") : rawValue;
  TPP.sync("commit");
  TPP.loadForm();
  TPP.renderAll();
};
