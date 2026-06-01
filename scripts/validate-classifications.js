#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const systemsPath = path.join(rootDir, "data", "classification-systems.json");
const mainExtensionsPath = path.join(
  rootDir,
  "data",
  "classification-extensions.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || null));
}

function findExtensionNode(nodes, targetExtension) {
  const target = String(targetExtension || "").trim();
  if (!target) return null;
  let found = null;
  function walk(entries) {
    for (const node of Array.isArray(entries) ? entries : []) {
      if (!node || found) continue;
      if (String(node.extension || "").trim() === target) {
        found = node;
        return;
      }
      walk(node.children);
    }
  }
  walk(nodes);
  return found;
}

function mergeExtensionCatalogs(baseCatalog, importedCatalogs) {
  const merged = cloneJson(baseCatalog) || {
    id: "tiny-shelf",
    classificationId: "tiny-shelf",
    imports: [],
    extensions: [],
  };
  const issues = [];
  merged.imports = Array.isArray(merged.imports) ? merged.imports : [];
  merged.extensions = Array.isArray(merged.extensions) ? merged.extensions : [];

  function appendChildren(targetNodes, sourceChildren) {
    const additions = Array.isArray(sourceChildren) ? sourceChildren : [];
    targetNodes.push(...additions.map((child) => cloneJson(child)));
  }

  for (const catalog of Array.isArray(importedCatalogs)
    ? importedCatalogs
    : []) {
    const imported = cloneJson(catalog);
    if (!imported || typeof imported !== "object") continue;
    for (const group of Array.isArray(imported.extensions)
      ? imported.extensions
      : []) {
      if (!group) continue;
      const parentCode = String(group.parentCode || "").trim();
      const attachTo = String(group.attachTo || "").trim();
      if (!parentCode) {
        issues.push("Imported extension group is missing a parentCode.");
        continue;
      }
      const existingGroup = merged.extensions.find(
        (entry) =>
          entry && String(entry.parentCode || "").trim() === parentCode,
      );
      if (attachTo) {
        if (!existingGroup) {
          issues.push(
            `Imported extension group ${parentCode}.${attachTo} cannot attach because parent group ${parentCode} does not exist.`,
          );
          continue;
        }
        const targetNode = findExtensionNode(existingGroup.children, attachTo);
        if (!targetNode) {
          issues.push(
            `Imported extension group ${parentCode}.${attachTo} cannot attach because extension ${parentCode}.${attachTo} does not exist.`,
          );
          continue;
        }
        targetNode.children = Array.isArray(targetNode.children)
          ? targetNode.children
          : [];
        appendChildren(targetNode.children, group.children);
        continue;
      }
      if (!existingGroup) {
        merged.extensions.push(cloneJson(group));
        continue;
      }
      existingGroup.children = Array.isArray(existingGroup.children)
        ? existingGroup.children
        : [];
      appendChildren(existingGroup.children, group.children);
    }
  }

  return { merged, issues };
}

function normalizeList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
}

function isActiveNode(node) {
  return (
    String((node && node.status) || "active")
      .trim()
      .toLowerCase() === "active"
  );
}

function addRefTarget(targets, code, sourceLabel) {
  const value = String(code || "").trim();
  if (!value) return;
  if (!targets.has(value)) targets.set(value, new Set());
  targets.get(value).add(sourceLabel);
}

function collectBaseData(system) {
  const currentCodes = new Map();
  const activeCodes = new Map();
  const activeShortLabels = new Map();
  const referenceTargets = new Map();
  const duplicates = [];
  const shortLabelDuplicates = [];
  const nodes = [];

  function walk(entries, pathLabels) {
    for (const node of Array.isArray(entries) ? entries : []) {
      if (!node) continue;
      const code = String(node.code || "").trim();
      const shortLabel = String(node.shortLabel || "")
        .trim()
        .toUpperCase();
      const labelPath = pathLabels.concat(String(node.label || "")).join(" > ");

      nodes.push({ node, labelPath });
      addRefTarget(referenceTargets, code, labelPath);

      if (code) currentCodes.set(code, { node, labelPath });
      if (code && isActiveNode(node)) {
        if (activeCodes.has(code)) {
          duplicates.push({
            code,
            first: activeCodes.get(code),
            second: labelPath,
          });
        } else {
          activeCodes.set(code, labelPath);
        }
      }
      if (shortLabel && isActiveNode(node)) {
        if (activeShortLabels.has(shortLabel)) {
          shortLabelDuplicates.push({
            shortLabel,
            first: activeShortLabels.get(shortLabel),
            second: labelPath,
          });
        } else {
          activeShortLabels.set(shortLabel, labelPath);
        }
      }

      walk(node.children, pathLabels.concat(String(node.label || "")));
    }
  }

  walk(system.categories, []);
  return {
    currentCodes,
    referenceTargets,
    duplicates,
    shortLabelDuplicates,
    nodes,
  };
}

function collectExtensionData(extensionSystem) {
  const referenceTargets = new Map();
  const activeCodes = new Map();
  const duplicates = [];
  const shortLabelDuplicates = [];
  const orphanGroups = [];
  const nodes = [];

  function walkGroup(group) {
    const parentCode = String(group.parentCode || "").trim();
    const groupLabel = String(group.label || parentCode || "Extension Group");
    const activeShortLabels = new Map();

    function walk(entries, pathLabels) {
      for (const node of Array.isArray(entries) ? entries : []) {
        if (!node) continue;
        const extension = String(node.extension || "").trim();
        const shortLabel = String(node.shortLabel || "")
          .trim()
          .toUpperCase();
        const fullCode =
          parentCode && extension ? `${parentCode}.${extension}` : "";
        const labelPath = [groupLabel]
          .concat(pathLabels, String(node.label || ""))
          .filter(Boolean)
          .join(" > ");

        nodes.push({ node, labelPath, fullCode });
        addRefTarget(referenceTargets, fullCode, labelPath);

        if (fullCode && isActiveNode(node)) {
          if (activeCodes.has(fullCode)) {
            duplicates.push({
              code: fullCode,
              first: activeCodes.get(fullCode),
              second: labelPath,
            });
          } else {
            activeCodes.set(fullCode, labelPath);
          }
        }
        if (shortLabel && isActiveNode(node)) {
          if (activeShortLabels.has(shortLabel)) {
            shortLabelDuplicates.push({
              parentCode,
              shortLabel,
              first: activeShortLabels.get(shortLabel),
              second: labelPath,
            });
          } else {
            activeShortLabels.set(shortLabel, labelPath);
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
    if (!String(group.parentCode || "").trim()) {
      orphanGroups.push("[missing parentCode]");
      continue;
    }
    walkGroup(group);
  }

  return {
    referenceTargets,
    duplicates,
    shortLabelDuplicates,
    orphanGroups,
    nodes,
  };
}

function validateNodeReferences(nodes, kind, unresolved) {
  for (const entry of nodes) {
    const refs = normalizeList(entry.node && entry.node.seeAlso);
    for (const ref of refs) {
      if (!allReferenceTargets.has(ref)) {
        unresolved.push({
          kind,
          type: "seeAlso",
          source: entry.labelPath,
          ref,
        });
      }
    }
    const replacedBy = String(
      (entry.node && entry.node.replacedBy) || "",
    ).trim();
    if (replacedBy && !allReferenceTargets.has(replacedBy)) {
      unresolved.push({
        kind,
        type: "replacedBy",
        source: entry.labelPath,
        ref: replacedBy,
      });
    }
  }
}

const system = readJson(systemsPath);
const baseExtensionSystem = readJson(mainExtensionsPath);
const importedExtensionSystems = [];
const extensionImportProblems = [];

for (const importPath of normalizeList(
  baseExtensionSystem && baseExtensionSystem.imports,
)) {
  const resolvedPath = path.join(rootDir, importPath);
  if (!fs.existsSync(resolvedPath)) {
    extensionImportProblems.push(
      `Classification extension import does not exist: ${importPath}`,
    );
    continue;
  }
  importedExtensionSystems.push(readJson(resolvedPath));
}

const mergedExtensions = mergeExtensionCatalogs(
  baseExtensionSystem,
  importedExtensionSystems,
);
const extensionSystem = mergedExtensions.merged;

if (!system || !extensionSystem) {
  console.error("Unable to load classification system or extension system.");
  process.exit(1);
}

const base = collectBaseData(system);
const ext = collectExtensionData(extensionSystem);
const allReferenceTargets = new Map([
  ...base.referenceTargets,
  ...ext.referenceTargets,
]);
const unresolved = [];

for (const group of Array.isArray(extensionSystem.extensions)
  ? extensionSystem.extensions
  : []) {
  const parentCode = String((group && group.parentCode) || "").trim();
  if (parentCode && !base.currentCodes.has(parentCode)) {
    ext.orphanGroups.push(parentCode);
  }
}

validateNodeReferences(base.nodes, "base", unresolved);
validateNodeReferences(ext.nodes, "extension", unresolved);

const problems = [];
const profileIds = new Map();
const allowedFormatPriorities = new Set(["high", "medium", "low"]);

problems.push(...extensionImportProblems, ...mergedExtensions.issues);

if (!String(system.id || "").trim()) {
  problems.push("Classification system is missing an id.");
}

if (!String(extensionSystem.id || "").trim()) {
  problems.push("Classification extensions are missing an id.");
}

if (
  String(extensionSystem.classificationId || "").trim() &&
  String(extensionSystem.classificationId || "").trim() !==
    String(system.id || "").trim()
) {
  problems.push(
    `Extension classificationId ${extensionSystem.classificationId} does not match system id ${system.id}.`,
  );
}

if (!system.license || !String(system.license.name || "").trim()) {
  problems.push("Classification system is missing license metadata.");
}

if (!Array.isArray(system.rules) || !system.rules.length) {
  problems.push("Classification system is missing classification rules.");
}

if (!Array.isArray(system.formats) || !system.formats.length) {
  problems.push("Classification system is missing classification formats.");
} else {
  const defaultFormats = [];
  for (const format of system.formats) {
    const formatId = String((format && format.id) || "").trim();
    const priority = String((format && format.priority) || "").trim();
    const isDefault = format && format.default === true;
    if (!formatId) {
      problems.push("Classification format is missing an id.");
      continue;
    }
    if (!priority) {
      problems.push(`Classification format ${formatId} is missing a priority.`);
      continue;
    }
    if (!allowedFormatPriorities.has(priority)) {
      problems.push(
        `Classification format ${formatId} has invalid priority ${priority}.`,
      );
      continue;
    }
    if (isDefault) defaultFormats.push(formatId);
  }
  if (defaultFormats.length !== 1) {
    problems.push(
      `Classification formats must define exactly one default format; found ${defaultFormats.length}${defaultFormats.length ? ` (${defaultFormats.join(", ")})` : ""}.`,
    );
  }
}

if (!Array.isArray(system.profiles) || !system.profiles.length) {
  problems.push("Classification system is missing classification profiles.");
} else {
  for (const profile of system.profiles) {
    const profileId = String((profile && profile.id) || "").trim();
    if (!profileId) {
      problems.push("Classification profile is missing an id.");
      continue;
    }
    if (profileIds.has(profileId)) {
      problems.push(
        `Duplicate classification profile id ${profileId}: ${profileIds.get(profileId)} | ${String((profile && profile.label) || profileId).trim()}`,
      );
    } else {
      profileIds.set(
        profileId,
        String((profile && profile.label) || profileId).trim(),
      );
    }
    const hiddenCodes = normalizeList(profile && profile.hiddenCodes);
    for (const code of hiddenCodes) {
      if (!base.currentCodes.has(code)) {
        problems.push(
          `Classification profile ${profileId} references hidden code ${code} that does not exist.`,
        );
      }
    }
  }
  if (!profileIds.has("home")) {
    problems.push("Classification system should define a home profile.");
  }
}

for (const duplicate of base.duplicates) {
  problems.push(
    `Duplicate active base code ${duplicate.code}: ${duplicate.first} | ${duplicate.second}`,
  );
}

for (const duplicate of base.shortLabelDuplicates) {
  problems.push(
    `Duplicate active base shortLabel ${duplicate.shortLabel}: ${duplicate.first} | ${duplicate.second}`,
  );
}

for (const duplicate of ext.duplicates) {
  problems.push(
    `Duplicate active extension code ${duplicate.code}: ${duplicate.first} | ${duplicate.second}`,
  );
}

for (const duplicate of ext.shortLabelDuplicates) {
  problems.push(
    `Duplicate active extension shortLabel ${duplicate.shortLabel} under parent ${duplicate.parentCode}: ${duplicate.first} | ${duplicate.second}`,
  );
}

for (const parentCode of ext.orphanGroups) {
  problems.push(`Extension group parentCode does not exist: ${parentCode}`);
}

for (const issue of unresolved) {
  problems.push(
    `Broken ${issue.type} reference in ${issue.kind} node "${issue.source}": ${issue.ref}`,
  );
}

if (problems.length) {
  console.error("Classification validation failed.");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Classification validation passed.");
console.log(`Base nodes: ${base.nodes.length}`);
console.log(`Extension nodes: ${ext.nodes.length}`);
console.log(`Valid reference targets: ${allReferenceTargets.size}`);
