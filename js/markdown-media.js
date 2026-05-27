window.TPP = window.TPP || {};

TPP.isImageUrl = function (url) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url || "");
};
TPP.safeMarkdown = function (text) {
  const raw = window.marked
    ? marked.parse(text || "", { gfm: true, breaks: true })
    : TPP.esc(text || "").replace(/\n/g, "<br>");
  return window.DOMPurify
    ? DOMPurify.sanitize(raw, {
        ADD_TAGS: ["u"],
        ADD_ATTR: ["class", "style", "data-url", "src", "alt"],
      })
    : raw;
};
TPP.extractLines = function (text) {
  const lines = String(text || "").split(/\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/^(https?:\/\/\S+)$/i);
    if (match) {
      const url = match[1];
      let caption = "";
      if (
        lines[i + 1] &&
        lines[i + 1].trim() &&
        !/^https?:\/\/\S+$/i.test(lines[i + 1].trim())
      ) {
        caption = lines[i + 1].trim();
        i++;
      }
      out.push({
        type: TPP.isImageUrl(url) ? "imageUrl" : "url",
        url,
        caption,
      });
    } else {
      out.push({ type: "text", text: lines[i] });
    }
  }
  return out;
};
TPP.blocksFromText = function (text, settings) {
  const blocks = [];
  let buffer = [];
  const flushBuffer = function () {
    if (!buffer.length) return;
    const markdown = buffer.join("\n");
    if (markdown.trim()) {
      blocks.push({
        type: "html",
        html:
          '<div class="story-text">' + TPP.safeMarkdown(markdown) + "</div>",
      });
    }
    buffer = [];
  };
  TPP.extractLines(text).forEach(function (item) {
    if (item.type === "text") {
      buffer.push(item.text);
      return;
    }
    flushBuffer();
    if (item.type === "imageUrl" && settings.imageUrlMode === "image") {
      blocks.push({
        type: "figure",
        html:
          '<figure class="figure image-figure"><img src="' +
          TPP.esc(item.url) +
          '"><figcaption class="caption">' +
          TPP.esc(item.caption) +
          "</figcaption></figure>",
      });
    } else if (settings.qrDisplayMode === "text") {
      blocks.push({
        type: "html",
        html:
          '<div class="story-text"><p>' +
          TPP.esc(item.url) +
          "</p>" +
          (item.caption ? "<p>" + TPP.esc(item.caption) + "</p>" : "") +
          "</div>",
      });
    } else {
      blocks.push({
        type: "qr",
        url: item.url,
        caption: item.caption,
        html:
          '<figure class="figure qr-figure"><span class="qr-holder" data-url="' +
          TPP.esc(item.url) +
          '"></span>' +
          (item.caption
            ? '<figcaption class="caption">' +
              TPP.esc(item.caption) +
              "</figcaption>"
            : "") +
          "</figure>",
      });
    }
  });
  flushBuffer();
  return blocks;
};
TPP.hexRgb = function (hex) {
  const match = String(hex || "")
    .trim()
    .match(/^#?([0-9a-f]{6})$/i);
  if (!match) return { r: 255, g: 255, b: 255 };
  const value = parseInt(match[1], 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};
TPP.relativeLuminance = function (hex) {
  const rgb = TPP.hexRgb(hex);
  const channel = function (value) {
    value /= 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
};
TPP.contrastRatio = function (a, b) {
  const l1 = TPP.relativeLuminance(a);
  const l2 = TPP.relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
TPP.autoQrDark = function (pageBg) {
  return TPP.contrastRatio(pageBg, "#000000") >=
    TPP.contrastRatio(pageBg, "#ffffff")
    ? "#000000"
    : "#ffffff";
};
TPP.qrColors = function (settings) {
  settings = settings || TPP.active || {};
  const light =
    settings.qrLightMode === "custom"
      ? settings.qrLightColor || "#ffffff"
      : settings.pageBg || "#ffffff";
  let dark =
    settings.qrDarkMode === "custom"
      ? settings.qrDarkColor || "#000000"
      : TPP.autoQrDark(light);
  if (dark.toLowerCase() === light.toLowerCase()) dark = TPP.autoQrDark(light);
  return { dark: dark, light: light };
};
TPP.renderQr = function (root, settings) {
  if (!window.QRCode) return;
  const colors = TPP.qrColors(settings);
  root.querySelectorAll(".qr-holder").forEach(function (holder) {
    if (holder.dataset.done) return;
    holder.style.background = colors.light;
    new QRCode(holder, {
      text: holder.dataset.url,
      width: 96,
      height: 96,
      colorDark: colors.dark,
      colorLight: colors.light,
      correctLevel: QRCode.CorrectLevel.M,
    });
    holder.dataset.done = "1";
  });
};
