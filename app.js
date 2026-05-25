const $ = id => document.getElementById(id);

const STORAGE_KEY = "tinyPocketsPressSettingsV2";

const defaultStory = "Santa\u2019s Little OSHA Violation\n\nA jolly \u201cHo-ho-ho\u201d came from behind, followed by \u201cHidey ho, neighbor!\u201d\n\n\u201cHello Santa,\u201d little Timmy replied.\n\n\u201cWhy the long face?\u201d Santa asked.\n\nTimmy showed him a block of wood. \u201cI\u2019m building a pinewood derby car, but I have no tools.\u201d\n\nSanta put his hands on his waist and made grunting sounds, followed by the order: \u201cNever give up. Never surrender!\u201d\n\nSanta went into his bag and grabbed a few presents, handing them over. Timmy quickly ripped open the packages, finding a chainsaw, angle grinder, nail gun, industrial CNC router, plasma cutter, and a flame thrower, while Santa shouted, \u201cMore power!\u201d";

const defaults = {
  title: "Santa’s Little OSHA Violation",
  author: "Lewis Moten",
  pubDate: "2026-05-24",
  publisher: "Tiny Pockets Press",
  copyright: "",
  printing: "First Printing",
  volume: "",
  number: "No. 1048",
  seriesName: "100 Word Stories Weekly Challenge",
  story: defaultStory,
  includeToc: true,
  pageSize: "one-inch",
  sheetSize: "letter",
  customPageWidth: 1,
  customPageHeight: 1,
  margin: 0.08,
  fontSize: 5.5,
  fontFamily: "Georgia, serif",
  paperThickness: 0.004,
  showPageNumbers: true,
  showBorder: true,
  showCutGuides: true,
  showFoldGuides: true,
  coverBg: "#7b1f2a",
  coverTextColor: "#fff8e8",
  imageX: 0,
  imageY: 20,
  imageZoom: 85,
  stapleLimit: 16,
  signatureSize: 16,
  forceSpine: false
};

const reusableIds = [
  "author", "publisher", "copyright", "printing", "volume", "number", "seriesName",
  "pageSize", "sheetSize", "customPageWidth", "customPageHeight", "margin", "fontSize",
  "fontFamily", "paperThickness", "showPageNumbers", "showBorder", "showCutGuides",
  "showFoldGuides", "coverBg", "coverTextColor", "imageX", "imageY", "imageZoom",
  "stapleLimit", "signatureSize", "forceSpine", "includeToc"
];

const sizes = {
  "one-inch": { w: 1, h: 1 },
  "pocket-16": { w: 2.125, h: 2.75 },
  "business-card": { w: 2, h: 3.5 },
  "sixteenth-letter": { w: 2.125, h: 2.75 },
  "eighth-letter": { w: 2.75, h: 4.25 },
  "quarter-letter": { w: 4.25, h: 5.5 },
  "sixth-letter": { w: 2.833, h: 5.5 },
  "a7": { w: 2.913, h: 4.134 },
  "a6": { w: 4.134, h: 5.827 }
};

const sheetSizes = {
  "letter": { w: 8.5, h: 11 },
  "legal": { w: 8.5, h: 14 },
  "a4": { w: 8.267, h: 11.693 }
};

let coverImageData = "";

function savedSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function loadInitialValues() {
  const saved = savedSettings();
  const combined = { ...defaults, ...saved };
  // Do not persist story/title; fresh projects start with the sample.
  combined.story = defaults.story;
  combined.title = defaults.title;

  for (const [id, value] of Object.entries(combined)) {
    const el = $(id);
    if (!el) continue;
    if (el.type === "checkbox") el.checked = Boolean(value);
    else el.value = value;
  }

  if (!$("copyright").value.trim()) {
    $("copyright").value = `© ${new Date($("pubDate").value || Date.now()).getFullYear()} ${$("author").value || "Author"}. All rights reserved.`;
  }

  document.querySelector(".custom-size").hidden = $("pageSize").value !== "custom";
}

function saveReusableSettings() {
  const data = {};
  reusableIds.forEach(id => {
    const el = $(id);
    if (!el) return;
    data[id] = el.type === "checkbox" ? el.checked : el.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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
    copyright: $("copyright").value.trim(),
    printing: $("printing").value,
    volume: $("volume").value.trim(),
    number: $("number").value.trim(),
    seriesName: $("seriesName").value.trim(),
    story: $("story").value.trim(),
    includeToc: $("includeToc").checked,
    page,
    sheet: sheetSizes[$("sheetSize").value],
    margin: Number($("margin").value),
    fontSize: Number($("fontSize").value),
    fontFamily: $("fontFamily").value,
    showPageNumbers: $("showPageNumbers").checked,
    showBorder: $("showBorder").checked,
    showCutGuides: $("showCutGuides").checked,
    showFoldGuides: $("showFoldGuides").checked,
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
  return String(text).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function makePage(type, html, n, extra = {}) {
  return { type, html, n, ...extra };
}

function parseChapters(story) {
  return story.split(/\n\s*---\s*\n/g)
    .map(block => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split(/\n/);
      const first = (lines.shift() || `Chapter ${index + 1}`).trim();
      return {
        title: first || `Chapter ${index + 1}`,
        text: lines.join("\n").trim()
      };
    });
}

function estimateCharsPerPage(settings) {
  const usableW = Math.max(0.25, settings.page.w - settings.margin * 2);
  const usableH = Math.max(0.25, settings.page.h - settings.margin * 2 - .05);
  const charsPerLine = Math.floor((usableW * 72) / (settings.fontSize * .52));
  const lines = Math.floor((usableH * 72) / (settings.fontSize * 1.35));
  return Math.max(20, charsPerLine * lines);
}

function chunkStory(text, charsPerPage) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    for (const word of words) {
      const candidate = (current + " " + word).trim();
      if (candidate.length > charsPerPage && current) {
        chunks.push(current.trim());
        current = word;
      } else {
        current = candidate;
      }
    }
    current += "\n\n";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [""];
}

function buildLogicalPages(settings) {
  const pages = [];

  const series = [settings.seriesName, settings.number].filter(Boolean).join(" ");
  const imprintBits = [
    settings.publisher,
    formatDate(settings.pubDate),
    settings.printing,
    settings.volume,
    settings.number,
    settings.copyright
  ].filter(Boolean);

  const coverHtml = `
    ${coverImageData ? `<img class="cover-img" src="${coverImageData}" style="width:${settings.imageZoom}%; margin-left:${settings.imageX}%; margin-top:${settings.imageY}%;">` : ""}
    <div class="cover-content">
      ${series ? `<div class="cover-series">${escapeHtml(series)}</div>` : ""}
      <div class="cover-title">${escapeHtml(settings.title)}</div>
      ${settings.author ? `<div class="cover-author">by ${escapeHtml(settings.author)}</div>` : ""}
      ${settings.publisher ? `<div class="cover-author">${escapeHtml(settings.publisher)}</div>` : ""}
    </div>`;

  pages.push(makePage("cover", coverHtml, 1, { isCover: true }));

  const titleHtml = `
    <div class="story-title">${escapeHtml(settings.title)}</div>
    <div class="story-meta">
      ${settings.author ? `By ${escapeHtml(settings.author)}<br>` : ""}
      ${series ? `${escapeHtml(series)}<br>` : ""}
      ${settings.publisher ? `${escapeHtml(settings.publisher)}<br>` : ""}
      ${formatDate(settings.pubDate)}
    </div>
    <div class="copyright-page">${imprintBits.map(escapeHtml).join("<br>")}</div>`;

  pages.push(makePage("text", titleHtml, 2));

  const chapters = parseChapters(settings.story);

  if (settings.includeToc && chapters.length > 1) {
    const tocItems = chapters.map(ch => `<li><span>${escapeHtml(ch.title)}</span><span>…</span></li>`).join("");
    pages.push(makePage("text", `<div class="story-title">Contents</div><ol class="toc-list">${tocItems}</ol>`, pages.length + 1));
  }

  chapters.forEach((chapter) => {
    const chapterStart = pages.length + 1;
    pages.push(makePage("text", `<div class="chapter-heading">${escapeHtml(chapter.title)}</div>`, chapterStart, { chapterTitle: chapter.title }));
    const chunks = chunkStory(chapter.text, estimateCharsPerPage(settings));
    chunks.forEach((chunk) => {
      pages.push(makePage("text", `<div class="story-text">${escapeHtml(chunk)}</div>`, pages.length + 1));
    });
  });

  while (pages.length % 4 !== 0) {
    pages.push(makePage("blank", `<span>Blank</span>`, pages.length + 1));
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

function pageElement(page, settings, x, y) {
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

function guideLine(sheet, className, left, top, width, height) {
  const g = document.createElement("div");
  g.className = className;
  g.style.left = `${left}in`;
  g.style.top = `${top}in`;
  g.style.width = `${width}in`;
  g.style.height = `${height}in`;
  sheet.appendChild(g);
}

function addGuides(sheet, settings, startX, startY) {
  const pageW = settings.page.w;
  const pageH = settings.page.h;

  if (settings.showCutGuides) {
    const len = Math.min(.12, pageW / 8, pageH / 8);
    const xs = [startX, startX + pageW, startX + pageW * 2];
    const ys = [startY, startY + pageH];

    xs.forEach(x => {
      guideLine(sheet, "cut-guide", x - .005, startY - len, .01, len);
      guideLine(sheet, "cut-guide", x - .005, startY + pageH, .01, len);
    });
    ys.forEach(y => {
      guideLine(sheet, "cut-guide", startX - len, y - .005, len, .01);
      guideLine(sheet, "cut-guide", startX + pageW * 2, y - .005, len, .01);
    });
  }

  if (settings.showFoldGuides) {
    guideLine(sheet, "fold-guide vertical", startX + pageW, startY, 0, pageH);
  }
}

function addSewingMarks(sheet, signatureIndex, signatureCount, settings, leftEdgeIn, topIn, heightIn) {
  const boxHeight = Math.max(.08, Math.min(.28, heightIn / Math.max(signatureCount + 2, 1)));
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
  label.style.left = `${leftEdgeIn + .065}in`;
  label.style.top = `${y}in`;
  sheet.appendChild(label);
}

function addSpine(sheet, settings, x, y, height, pageCount) {
  const spineWidth = Math.max(.04, pageCount * settings.paperThickness);
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
    Finished size: ${settings.page.w.toFixed(3)} × ${settings.page.h.toFixed(3)} in.
    Binding: ${hasSpine ? `sewn signatures with an estimated ${Math.max(.04, pages.length * settings.paperThickness).toFixed(3)} in spine` : "stapled booklet / no spine"}.
    ${hasSpine ? `Signature marks: ${signatureCount} group${signatureCount === 1 ? "" : "s"}. Cover/spine sheets do not receive binding alignment marks.` : ""}
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
      addGuides(sheet, settings, startX, startY);

      if (hasSpine && side === "front") {
        const hasCoverOrSpine = leftPage?.isCover || rightPage?.isCover;
        if (hasCoverOrSpine) {
          addSpine(sheet, settings, startX + settings.page.w, startY, settings.page.h, pages.length);
        } else {
          const signatureIndex = Math.floor(sheetIndex * 4 / settings.signatureSize);
          addSewingMarks(sheet, signatureIndex, signatureCount, settings, startX + settings.page.w - .03, startY, settings.page.h);
        }
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
    const oldMargin = sheet.style.marginBottom;
    sheet.style.transform = "none";
    sheet.style.marginBottom = "0";
    const canvas = await html2canvas(sheet, { scale: 3, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    if (i > 0) pdf.addPage([settings.sheet.w, settings.sheet.h]);
    pdf.addImage(img, "JPEG", 0, 0, settings.sheet.w, settings.sheet.h);
    sheet.style.transform = oldTransform;
    sheet.style.marginBottom = oldMargin;
  }

  const safeTitle = (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  pdf.save(`${safeTitle || "tiny-book"}.pdf`);
}

function wireEvents() {
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach(input => input.addEventListener("input", () => {
    if (reusableIds.includes(input.id)) saveReusableSettings();
    render();
  }));

  $("author").addEventListener("input", () => {
    if (!$("copyright").dataset.touched) {
      $("copyright").value = `© ${new Date($("pubDate").value || Date.now()).getFullYear()} ${$("author").value || "Author"}. All rights reserved.`;
    }
  });

  $("pubDate").addEventListener("input", () => {
    if (!$("copyright").dataset.touched) {
      $("copyright").value = `© ${new Date($("pubDate").value || Date.now()).getFullYear()} ${$("author").value || "Author"}. All rights reserved.`;
    }
  });

  $("copyright").addEventListener("input", () => $("copyright").dataset.touched = "true");

  $("refreshBtn").addEventListener("click", render);
  $("printBtn").addEventListener("click", () => window.print());
  $("exportPdfBtn").addEventListener("click", exportPDF);

  $("resetSavedBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  $("pageSize").addEventListener("change", () => {
    document.querySelector(".custom-size").hidden = $("pageSize").value !== "custom";
    saveReusableSettings();
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
}

document.addEventListener("DOMContentLoaded", () => {
  loadInitialValues();
  wireEvents();
  render();
});
