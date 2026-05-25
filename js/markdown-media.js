window.TPP = window.TPP || {};

TPP.isImageUrl = function (url) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url || "");
};
TPP.safeMarkdown = function (text) {
  const raw = window.marked
    ? marked.parse(text || "", { gfm: true, breaks: true })
    : TPP.esc(text || "").replace(/\n/g, "<br>");
  return window.DOMPurify
    ? DOMPurify.sanitize(raw, { ADD_TAGS: ["u"], ADD_ATTR: ["class", "style", "data-url", "src", "alt"] })
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
      out.push({ type: TPP.isImageUrl(url) ? "imageUrl" : "url", url, caption });
    } else {
      out.push({ type: "text", text: lines[i] });
    }
  }
  return out;
};
TPP.blocksFromText = function (text, settings) {
  const blocks = [];
  let buffer = [];
  TPP.extractLines(text).forEach(function (item) {
    if (item.type === "text") {
      buffer.push(item.text);
      return;
    }
    if (buffer.length) {
      blocks.push({ type: "html", html: '<div class="story-text">' + TPP.safeMarkdown(buffer.join("\n")) + "</div>" });
      buffer = [];
    }
    if (item.type === "imageUrl" && settings.imageUrlMode === "image") {
      blocks.push({
        type: "figure",
        html: '<figure class="figure image-figure"><img src="' + TPP.esc(item.url) + '"><figcaption class="caption">' + TPP.esc(item.caption) + "</figcaption></figure>"
      });
    } else if (settings.qrDisplayMode === "text") {
      blocks.push({
        type: "html",
        html: '<div class="story-text"><p>' + TPP.esc(item.url) + "</p>" + (item.caption ? "<p>" + TPP.esc(item.caption) + "</p>" : "") + "</div>"
      });
    } else {
      blocks.push({
        type: "qr",
        html: '<figure class="figure qr-figure"><span class="qr-holder" data-url="' + TPP.esc(item.url) + '"></span>' + (item.caption ? '<figcaption class="caption">' + TPP.esc(item.caption) + "</figcaption>" : "") + "</figure>"
      });
    }
  });
  if (buffer.length) {
    blocks.push({ type: "html", html: '<div class="story-text">' + TPP.safeMarkdown(buffer.join("\n")) + "</div>" });
  }
  return blocks;
};
TPP.renderQr = function (root) {
  if (!window.QRCode) return;
  root.querySelectorAll(".qr-holder").forEach(function (holder) {
    if (holder.dataset.done) return;
    new QRCode(holder, {
      text: holder.dataset.url,
      width: 96,
      height: 96,
      correctLevel: QRCode.CorrectLevel.M
    });
    holder.dataset.done = "1";
  });
};
