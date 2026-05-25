const $ = id => document.getElementById(id);

const sizes = {
  "quarter-letter": { w: 4.25, h: 5.5 },
  "sixth-letter": { w: 2.833, h: 5.5 },
  "a6": { w: 4.134, h: 5.827 },
};

const sheetSizes = {
  "letter": { w: 8.5, h: 11 },
  "legal": { w: 8.5, h: 14 },
  "a4": { w: 8.267, h: 11.693 },
};

let coverImageData = "";

function readSettings() {
  const pageSize = $("pageSize").value;
  const page = pageSize === "custom"
    ? { w: Number($("customPageWidth").value), h: Number($("customPageHeight").value) }
    : sizes[pageSize];

  return {
    title: $("title").value.trim() || "Untitled",
    author: $("author").value.trim(),
    pubDate: $("pubDate").value,
    publisher: $("publisher").value.trim(),
    seriesName: $("seriesName").value.trim(),
    seriesNumber: $("seriesNumber").value.trim(),
    story: $("story").value.trim(),
    page,
    sheet: sheetSizes[$("sheetSize").value],
    margin: Number($("margin").value),
    fontSize: Number($("fontSize").value),
    fontFamily: $("fontFamily").value,
    showPageNumbers: $("showPageNumbers").checked,
    showBorder: $("showBorder").checked,
    coverBg: $("coverBg").value,
    coverTextColor: $("coverTextColor").value,
    imageX: Number($("imageX").value),
    imageY: Number($("imageY").value),
    imageZoom: Number($("imageZoom").value),
    stapleLimit: Number($("stapleLimit").value),
    signatureSize: Math.max(4, Math.ceil(Number($("signatureSize").value) / 4) * 4),
    paperThickness: Number($("paperThickness").value),
    forceSpine: $("forceSpine").checked,
  };
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function makePage(type, html, n, settings) {
  return { type, html, n, settings };
}

function estimateCharsPerPage(settings) {
  const usableW = Math.max(1, settings.page.w - settings.margin * 2);
  const usableH = Math.max(1, settings.page.h - settings.margin * 2 - .25);
  const charsPerLine = Math.floor((usableW * 72) / (settings.fontSize * .52));
  const lines = Math.floor((usableH * 72) / (settings.fontSize * 1.35));
  return Math.max(80, charsPerLine * lines);
}

function chunkStory(text, charsPerPage) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > charsPerPage && current) {
      chunks.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [""];
}

function buildLogicalPages(settings) {
  const pages = [];

  const series = [settings.seriesName, settings.seriesNumber ? `No. ${settings.seriesNumber}` : ""]
    .filter(Boolean).join(" ");

  const coverHtml = `
    ${coverImageData ? `<img class="cover-img" src="${coverImageData}" style="width:${settings.imageZoom}%; margin-left:${settings.imageX}%; margin-top:${settings.imageY}%;">` : ""}
    <div class="cover-content">
      ${series ? `<div class="cover-series">${escapeHtml(series)}</div>` : ""}
      <div class="cover-title">${escapeHtml(settings.title)}</div>
      ${settings.author ? `<div class="cover-author">by ${escapeHtml(settings.author)}</div>` : ""}
      ${settings.publisher ? `<div class="cover-author">${escapeHtml(settings.publisher)}</div>` : ""}
    </div>`;

  pages.push(makePage("cover", coverHtml, 1, settings));

  const titleHtml = `
    <div class="story-title">${escapeHtml(settings.title)}</div>
    <div class="story-meta">
      ${settings.author ? `By ${escapeHtml(settings.author)}<br>` : ""}
      ${settings.publisher ? `${escapeHtml(settings.publisher)}<br>` : ""}
      ${formatDate(settings.pubDate)}
    </div>`;

  pages.push(makePage("text", titleHtml, 2, settings));

  const chunks = chunkStory(settings.story, estimateCharsPerPage(settings));
  chunks.forEach((chunk, i) => {
    pages.push(makePage("text", `<div class="story-text">${escapeHtml(chunk)}</div>`, i + 3, settings));
  });

  const aboutHtml = `
    <div class="story-title">About This Tiny Book</div>
    <div class="story-text">
      ${settings.title ? `<strong>${escapeHtml(settings.title)}</strong><br>` : ""}
      ${settings.author ? `Author: ${escapeHtml(settings.author)}<br>` : ""}
      ${settings.publisher ? `Publisher: ${escapeHtml(settings.publisher)}<br>` : ""}
      ${formatDate(settings.pubDate) ? `Published: ${formatDate(settings.pubDate)}<br>` : ""}
      ${series ? `Series: ${escapeHtml(series)}<br>` : ""}
    </div>`;
  pages.push(makePage("text", aboutHtml, pages.length + 1, settings));

  while (pages.length % 4 !== 0) {
    pages.push(makePage("blank", `<span>Blank</span>`, pages.length + 1, settings));
  }

  return pages;
}

function bookletOrder(pageCount) {
  const sheets = [];
  for (let left = 1, right = pageCount; left < right; left += 2, right -= 2) {
    sheets.push({
      front: [right, left],
      back: [left + 1, right - 1]
    });
  }
  return sheets;
}

function pageElement(page, settings, x, y, rotate = false) {
  const div = document.createElement("div");
  div.className = `page ${page.type} ${settings.showBorder && page.type === "cover" ? "framed" : ""}`;
  div.style.left = `${x}in`;
  div.style.top = `${y}in`;
  div.style.width = `${settings.page.w}in`;
  div.style.height = `${settings.page.h}in`;
  div.style.setProperty("--page-margin", `${settings.margin}in`);
  div.style.setProperty("--cover-bg", settings.coverBg);
  div.style.setProperty("--cover-text", settings.coverTextColor);
  div.style.fontSize = `${settings.fontSize}pt`;
  div.style.fontFamily = settings.fontFamily;
  if (rotate) {
    div.style.transformOrigin = "center center";
    div.style.transform = "rotate(180deg)";
  }

  const inner = document.createElement("div");
  inner.className = "page-inner";
  if (page.type === "blank") inner.classList.add("blank");
  inner.innerHTML = page.html;

  if (settings.showPageNumbers && page.type !== "cover" && page.type !== "blank") {
    inner.insertAdjacentHTML("beforeend", `<div class="page-number">${page.n}</div>`);
  }

  div.appendChild(inner);
  return div;
}

function addSewingMarks(sheet, signatureIndex, signatureCount, settings, leftEdgeIn, topIn, heightIn) {
  const boxHeight = Math.max(.15, Math.min(.45, heightIn / Math.max(signatureCount, 1)));
  const usable = heightIn - boxHeight;
  const y = topIn + (signatureCount <= 1 ? usable / 2 : usable * (signatureIndex / (signatureCount - 1)));

  const mark = document.createElement("div");
  mark.className = "sewing-mark";
  mark.style.left = `${leftEdgeIn}in`;
  mark.style.top = `${y}in`;
  mark.style.height = `${boxHeight}in`;
  sheet.appendChild(mark);

  const label = document.createElement("div");
  label.className = "signature-label";
  label.textContent = `S${signatureIndex + 1}`;
  label.style.left = `${leftEdgeIn + .09}in`;
  label.style.top = `${y}in`;
  sheet.appendChild(label);
}

function addSpine(sheet, settings, x, y, height, pageCount) {
  const spineWidth = Math.max(.06, pageCount * settings.paperThickness);
  const spine = document.createElement("div");
  spine.className = "spine";
  spine.style.left = `${x - spineWidth / 2}in`;
  spine.style.top = `${y}in`;
  spine.style.width = `${spineWidth}in`;
  spine.style.height = `${height}in`;
  spine.style.setProperty("--cover-bg", settings.coverBg);
  spine.style.setProperty("--cover-text", settings.coverTextColor);
  spine.innerHTML = `<span>${escapeHtml(settings.title)}</span>`;
  sheet.appendChild(spine);
}

function render() {
  const settings = readSettings();
  const pages = buildLogicalPages(settings);
  const preview = $("preview");
  preview.innerHTML = "";

  const hasSpine = settings.forceSpine || pages.length > settings.stapleLimit;
  const signatureCount = Math.ceil(pages.length / settings.signatureSize);
  const orders = bookletOrder(pages.length);

  $("summary").innerHTML = `
    <strong>${pages.length} booklet pages</strong> on ${orders.length} sheets, double-sided.
    Binding: ${hasSpine ? `sewn signatures with an estimated ${Math.max(.06, pages.length * settings.paperThickness).toFixed(3)} in spine` : "stapled booklet / no spine"}.
    ${hasSpine ? `Signature marks: ${signatureCount} group${signatureCount === 1 ? "" : "s"}.` : ""}
  `;

  const scale = Math.min(1, 900 / (settings.sheet.w * 96));
  preview.style.setProperty("--scale", scale);

  orders.forEach((order, sheetIndex) => {
    ["front", "back"].forEach(side => {
      const sheet = document.createElement("div");
      sheet.className = "sheet";
      sheet.dataset.pdfPage = "true";
      sheet.style.width = `${settings.sheet.w}in`;
      sheet.style.height = `${settings.sheet.h}in`;
      sheet.style.transformOrigin = "top center";
      sheet.style.transform = `scale(${scale})`;
      sheet.style.marginBottom = `${(scale - 1) * settings.sheet.h}in`;

      const label = document.createElement("div");
      label.className = "sheet-title";
      label.textContent = `Sheet ${sheetIndex + 1} — ${side}`;
      sheet.appendChild(label);

      const totalBookletWidth = settings.page.w * 2;
      const startX = (settings.sheet.w - totalBookletWidth) / 2;
      const startY = (settings.sheet.h - settings.page.h) / 2;

      const [leftPageNo, rightPageNo] = order[side];
      const leftPage = pages[leftPageNo - 1];
      const rightPage = pages[rightPageNo - 1];

      sheet.appendChild(pageElement(leftPage, settings, startX, startY));
      sheet.appendChild(pageElement(rightPage, settings, startX + settings.page.w, startY));

      const foldLine = document.createElement("div");
      foldLine.className = "crop-mark";
      foldLine.style.left = `${startX + settings.page.w - .005}in`;
      foldLine.style.top = `${startY}in`;
      foldLine.style.width = `.01in`;
      foldLine.style.height = `${settings.page.h}in`;
      foldLine.style.opacity = ".2";
      sheet.appendChild(foldLine);

      if (hasSpine && side === "front") {
        addSpine(sheet, settings, startX + settings.page.w, startY, settings.page.h, pages.length);
        const signatureIndex = Math.floor(sheetIndex * 4 / settings.signatureSize);
        addSewingMarks(sheet, signatureIndex, signatureCount, settings, startX + settings.page.w - .04, startY, settings.page.h);
      }

      preview.appendChild(sheet);
    });
  });
}

async function exportPDF() {
  render();
  const settings = readSettings();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: settings.sheet.h >= settings.sheet.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.sheet.w, settings.sheet.h],
    compress: true,
  });

  const sheets = [...document.querySelectorAll('[data-pdf-page="true"]')];
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const oldTransform = sheet.style.transform;
    sheet.style.transform = "none";
    const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    if (i > 0) pdf.addPage([settings.sheet.w, settings.sheet.h]);
    pdf.addImage(img, "JPEG", 0, 0, settings.sheet.w, settings.sheet.h);
    sheet.style.transform = oldTransform;
  }

  const safeTitle = (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  pdf.save(`${safeTitle || "tiny-book"}.pdf`);
}

function wireEvents() {
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(input => input.addEventListener("input", render));
  $("refreshBtn").addEventListener("click", render);
  $("printBtn").addEventListener("click", () => window.print());
  $("exportPdfBtn").addEventListener("click", exportPDF);

  $("pageSize").addEventListener("change", () => {
    document.querySelector(".custom-size").hidden = $("pageSize").value !== "custom";
    render();
  });

  $("coverImage").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) {
      coverImageData = "";
      render();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      coverImageData = reader.result;
      render();
    };
    reader.readAsDataURL(file);
  });

  const today = new Date();
  $("pubDate").value = today.toISOString().slice(0, 10);
}

document.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  render();
});
