#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const systemsPath = path.join(rootDir, "data", "classification-systems.json");
const extensionsPath = path.join(
  rootDir,
  "data",
  "classification-extensions.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function nodeStatus(node) {
  return String((node && node.status) || "active")
    .trim()
    .toLowerCase();
}

function isActiveNode(node) {
  return nodeStatus(node) === "active";
}

function addRefTarget(targets, code, sourceLabel) {
  const value = String(code || "").trim();
  if (!value) return;
  if (!targets.has(value)) targets.set(value, new Set());
  targets.get(value).add(sourceLabel);
}

function collectBaseNodes(system) {
  const currentCodes = new Map();
  const allReferenceTargets = new Map();
  const baseNodes = [];

  function walk(nodes, pathLabels) {
    for (const node of Array.isArray(nodes) ? nodes : []) {
      if (!node) continue;
      const code = String(node.code || "").trim();
      const legacyCodes = normalizeList([
        node.legacyCode,
        ...normalizeList(node.legacyCodes),
      ]);
      const labelPath = pathLabels.concat(String(node.label || "")).join(" > ");

      baseNodes.push({
        code,
        labelPath,
        node,
      });

      if (code) currentCodes.set(code, { code, labelPath, node });
      addRefTarget(allReferenceTargets, code, labelPath);
      for (const legacyCode of legacyCodes) {
        addRefTarget(allReferenceTargets, legacyCode, `${labelPath} [legacy]`);
      }

      walk(node.children, pathLabels.concat(String(node.label || "")));
    }
  }

  walk(system.categories, []);
  return { currentCodes, allReferenceTargets, baseNodes };
}

function collectExtensionNodes(extensionSystem) {
  const allReferenceTargets = new Map();
  const currentActiveFullCodes = new Map();
  const activeDuplicates = [];
  const extensionNodes = [];

  function walkGroup(group) {
    const parentCode = String(group.parentCode || "").trim();
    const parentAliases = normalizeList([
      group.legacyParentCode,
      ...normalizeList(group.legacyParentCodes),
    ]);
    const groupLabel = String(group.label || parentCode || "Extension Group");

    function walk(nodes, pathLabels) {
      for (const node of Array.isArray(nodes) ? nodes : []) {
        if (!node) continue;
        const extension = String(node.extension || "").trim();
        const fullCode =
          parentCode && extension ? `${parentCode}.${extension}` : "";
        const aliasCodes = parentAliases.map((alias) =>
          alias && extension ? `${alias}.${extension}` : "",
        );
        const labelPath = [groupLabel]
          .concat(pathLabels, String(node.label || ""))
          .filter(Boolean)
          .join(" > ");

        extensionNodes.push({
          fullCode,
          labelPath,
          node,
        });

        addRefTarget(allReferenceTargets, fullCode, labelPath);
        for (const aliasCode of aliasCodes) {
          addRefTarget(allReferenceTargets, aliasCode, `${labelPath} [legacy]`);
        }

        if (fullCode && isActiveNode(node)) {
          if (currentActiveFullCodes.has(fullCode)) {
            activeDuplicates.push({
              code: fullCode,
              first: currentActiveFullCodes.get(fullCode),
              second: labelPath,
            });
          } else {
            currentActiveFullCodes.set(fullCode, labelPath);
          }
        }

        walk(node.children, pathLabels.concat(String(node.label || "")));
      }
    }

    walk(group.children, []);
  }

  for (const group of Array.isArray(extensionSystem.extensions)
    ? extensionSystem.extensions
    : []) {
    if (!group) continue;
    walkGroup(group);
  }

  return { allReferenceTargets, activeDuplicates, extensionNodes };
}

function validateReferences(nodes, kind, unresolved, validTargets, pathLabels) {
  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (!node) continue;
    const nextLabels = pathLabels.concat(String(node.label || ""));
    const labelPath = nextLabels.join(" > ");
    const seeAlso = normalizeList(node.seeAlso);
    for (const ref of seeAlso) {
      if (!validTargets.has(ref)) {
        unresolved.push({
          kind,
          type: "seeAlso",
          source: labelPath,
          ref,
        });
      }
    }
    const replacedBy = String(node.replacedBy || "").trim();
    if (replacedBy && !validTargets.has(replacedBy)) {
      unresolved.push({
        kind,
        type: "replacedBy",
        source: labelPath,
        ref: replacedBy,
      });
    }
    validateReferences(
      node.children,
      kind,
      unresolved,
      validTargets,
      nextLabels,
    );
  }
}

function main() {
  const systemsCatalog = readJson(systemsPath);
  const extensionsCatalog = readJson(extensionsPath);
  const system =
    (systemsCatalog.systems || []).find(
      (entry) => entry && entry.id === systemsCatalog.defaultSystemId,
    ) || (systemsCatalog.systems || [])[0];
  const extensionSystem =
    (extensionsCatalog.systems || []).find(
      (entry) => entry && entry.id === extensionsCatalog.defaultSystemId,
    ) || (extensionsCatalog.systems || [])[0];

  if (!system || !extensionSystem) {
    console.error("Unable to load classification system or extension system.");
    process.exit(1);
  }

  const base = collectBaseNodes(system);
  const ext = collectExtensionNodes(extensionSystem);
  const validTargets = new Map([
    ...base.allReferenceTargets,
    ...ext.allReferenceTargets,
  ]);
  const unresolved = [];

  validateReferences(system.categories, "base", unresolved, validTargets, []);
  for (const group of Array.isArray(extensionSystem.extensions)
    ? extensionSystem.extensions
    : []) {
    const prefix = [
      String(group.label || group.parentCode || "Extension Group"),
    ];
    validateReferences(
      group.children,
      "extension",
      unresolved,
      validTargets,
      prefix,
    );
  }

  const problems = [];

  if (ext.activeDuplicates.length) {
    problems.push("Duplicate active extension codes:");
    for (const duplicate of ext.activeDuplicates) {
      problems.push(
        `  - ${duplicate.code} appears in both "${duplicate.first}" and "${duplicate.second}"`,
      );
    }
  }

  if (unresolved.length) {
    problems.push("Broken classification references:");
    for (const item of unresolved) {
      problems.push(
        `  - ${item.type} "${item.ref}" from ${item.kind} node "${item.source}" does not resolve`,
      );
    }
  }

  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }

  console.log(
    [
      "Classification validation passed.",
      `  Base nodes: ${base.baseNodes.length}`,
      `  Extension nodes: ${ext.extensionNodes.length}`,
      `  Valid reference targets: ${validTargets.size}`,
    ].join("\n"),
  );
}

main();
