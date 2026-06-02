window.TPP = window.TPP || {};

TPP.SvgAssets = TPP.SvgAssets || {};
TPP.svgAssetRegistry = TPP.svgAssetRegistry || {};
TPP.svgAssetEmergencyLoading =
  TPP.svgAssetEmergencyLoading ||
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="4" y="4" width="40" height="40" rx="10" fill="#f7f2ea" stroke="#d8cfc4" stroke-width="2"/><circle cx="24" cy="24" r="7" stroke="#b9aa98" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 10"/></svg>';
TPP.svgAssetEmergencyBroken =
  TPP.svgAssetEmergencyBroken ||
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect x="4" y="4" width="40" height="40" rx="10" fill="#fff4f1" stroke="#d8b5aa" stroke-width="2"/><path d="M15 15l18 18M33 15L15 33" stroke="#b0572d" stroke-width="4" stroke-linecap="round"/></svg>';

TPP.registerSvgAsset = function (id, options) {
  const assetId = String(id || "").trim();
  if (!assetId) return null;
  const existing = TPP.svgAssetRegistry[assetId] || {};
  const next = Object.assign({}, existing, options || {});
  TPP.svgAssetRegistry[assetId] = next;
  return next;
};

TPP.svgAssetPlaceholderMarkup = function (kind) {
  const placeholderId = kind === "broken" ? "svg-broken" : "svg-loading";
  const entry = TPP.svgAssetRegistry[placeholderId];
  if (entry && typeof entry.content === "string" && entry.content) {
    return entry.content;
  }
  return kind === "broken"
    ? TPP.svgAssetEmergencyBroken
    : TPP.svgAssetEmergencyLoading;
};

TPP.ensureSvgAsset = async function (id) {
  const assetId = String(id || "").trim();
  const entry = TPP.svgAssetRegistry[assetId];
  if (!entry) return TPP.svgAssetPlaceholderMarkup("broken");
  if (typeof entry.content === "string" && entry.content) return entry.content;
  if (entry.pending) return entry.pending;
  if (!entry.path || typeof fetch !== "function") {
    entry.failed = true;
    entry.content = "";
    return TPP.svgAssetPlaceholderMarkup("broken");
  }
  entry.pending = fetch(entry.path)
    .then(function (response) {
      if (!response.ok) throw new Error("svg-asset");
      return response.text();
    })
    .then(function (text) {
      entry.content = String(text || "");
      entry.failed = false;
      return entry.content;
    })
    .catch(function () {
      entry.content = "";
      entry.failed = true;
      return TPP.svgAssetPlaceholderMarkup("broken");
    })
    .finally(function () {
      entry.pending = null;
    });
  return entry.pending;
};

TPP.primeSvgAssets = function (ids) {
  (Array.isArray(ids) ? ids : []).forEach(function (id) {
    TPP.ensureSvgAsset(id);
  });
};

TPP.renderSvgAsset = function (id, replacements, attributes) {
  const assetId = String(id || "").trim();
  const entry = TPP.svgAssetRegistry[assetId];
  const isLoaded = entry && typeof entry.content === "string" && entry.content;
  const template = !entry
    ? TPP.svgAssetPlaceholderMarkup("broken")
    : isLoaded
      ? entry.content
      : entry.failed
        ? TPP.svgAssetPlaceholderMarkup("broken")
        : TPP.svgAssetPlaceholderMarkup("loading");
  if (entry && !entry.content && entry.path) TPP.ensureSvgAsset(assetId);
  let svg = String(template).replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    function (_match, token) {
      const value =
        replacements &&
        Object.prototype.hasOwnProperty.call(replacements, token)
          ? replacements[token]
          : "";
      return TPP.esc ? TPP.esc(String(value || "")) : String(value || "");
    },
  );
  Object.entries((entry && entry.replaceableColors) || {}).forEach(
    function (pair) {
      const token = pair[0];
      const sourceColor = String(pair[1] || "").trim();
      const targetColor =
        replacements &&
        Object.prototype.hasOwnProperty.call(replacements, token)
          ? String(replacements[token] || "").trim()
          : "";
      if (!sourceColor || !targetColor || sourceColor === targetColor) return;
      svg = svg.split(sourceColor).join(targetColor);
    },
  );
  const attrs = Object.entries(attributes || {})
    .filter(function (entry) {
      return entry[0] && entry[1] != null && entry[1] !== "";
    })
    .map(function (entry) {
      const name = String(entry[0]).trim();
      const value = TPP.esc ? TPP.esc(String(entry[1])) : String(entry[1]);
      return name + '="' + value + '"';
    })
    .join(" ");
  if (!attrs) return svg;
  return svg.replace(/<svg\b([^>]*)>/, function (_match, existingAttrs) {
    return "<svg" + existingAttrs + " " + attrs + ">";
  });
};

TPP.registerSvgAsset("align-left", {
  path: "assets/align-left.svg",
  replaceableColors: {
    stroke: "#5a4d40",
  },
});
TPP.registerSvgAsset("align-center", {
  path: "assets/align-center.svg",
  replaceableColors: {
    stroke: "#5a4d40",
  },
});
TPP.registerSvgAsset("align-right", {
  path: "assets/align-right.svg",
  replaceableColors: {
    stroke: "#5a4d40",
  },
});
TPP.registerSvgAsset("align-justify", {
  path: "assets/align-justify.svg",
  replaceableColors: {
    stroke: "#5a4d40",
  },
});
TPP.registerSvgAsset("align-clip", {
  path: "assets/align-clip.svg",
  replaceableColors: {
    stroke: "#5a4d40",
    accent: "#b0572d",
  },
});
TPP.registerSvgAsset("text-outline-control", {
  path: "assets/text-outline-control.svg",
});
TPP.registerSvgAsset("svg-loading", {
  path: "assets/svg-loading.svg",
});
TPP.registerSvgAsset("svg-broken", {
  path: "assets/svg-broken.svg",
});
