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
  const referenceTargets = new Map();
  const duplicates = [];
  const nodes = [];

  function walk(entries, pathLabels) {
    for (const node of Array.isArray(entries) ? entries : []) {
      if (!node) continue;
      const code = String(node.code || "").trim();
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

      walk(node.children, pathLabels.concat(String(node.label || "")));
    }
  }

  walk(system.categories, []);
  return { currentCodes, referenceTargets, duplicates, nodes };
}

function collectExtensionData(extensionSystem) {
  const referenceTargets = new Map();
  const activeCodes = new Map();
  const duplicates = [];
  const orphanGroups = [];
  const nodes = [];

  function walkGroup(group) {
    const parentCode = String(group.parentCode || "").trim();
    const groupLabel = String(group.label || parentCode || "Extension Group");

    function walk(entries, pathLabels) {
      for (const node of Array.isArray(entries) ? entries : []) {
        if (!node) continue;
        const extension = String(node.extension || "").trim();
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

  return { referenceTargets, duplicates, orphanGroups, nodes };
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
const extensionSystem = readJson(extensionsPath);

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

for (const duplicate of base.duplicates) {
  problems.push(
    `Duplicate active base code ${duplicate.code}: ${duplicate.first} | ${duplicate.second}`,
  );
}

for (const duplicate of ext.duplicates) {
  problems.push(
    `Duplicate active extension code ${duplicate.code}: ${duplicate.first} | ${duplicate.second}`,
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
