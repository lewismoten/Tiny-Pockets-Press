window.TPP = window.TPP || {};

TPP.date = function (value) {
  if (!value) return "";
  return new Date(value + "T12:00:00").toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};
TPP.settings = function () {
  TPP.sync();
  const book = TPP.active;
  const raw = book.pageSize === "custom" ? { w: Number(book.customW), h: Number(book.customH) } : (TPP.sizes[book.pageSize] || TPP.sizes.one);
  return Object.assign({}, book, {
    signatureSize: TPP.signatureSize(book.signatureSize),
    sewingStations: TPP.sewingStations(book.sewingStations),
    sewingGuideOpacity: TPP.opacity(book.sewingGuideOpacity, 0.65),
    signatureGuideOpacity: TPP.opacity(book.signatureGuideOpacity, 0.65),
    imageExportDpi: TPP.dpi(book.imageExportDpi),
    mediaCaptionSize: TPP.mediaCaptionSize(book.mediaCaptionSize, book.captionSize),
    printTopOffset: Math.max(0, Number(book.printTopOffset) || 0),
    gutterMargin: Math.max(0, Number(book.gutterMargin) || 0),
    page: { w: Math.max(0.5, Number(raw.w) || 1), h: Math.max(0.5, Number(raw.h) || 1) },
    sheet: TPP.sheets[book.sheetSize] || TPP.sheets.letter
  });
};
TPP.measureBlock = function (html, settings) {
  let box = TPP.measureBox;
  if (!box) {
    box = document.createElement("div");
    box.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;overflow:visible;box-sizing:border-box;";
    document.body.appendChild(box);
    TPP.measureBox = box;
  }
  box.className = "page measure texture-none";
  box.style.width = Math.max(0.05, settings.page.w - 2 * settings.margin - settings.gutterMargin) + "in";
  box.style.fontFamily = settings.fontFamily;
  box.style.fontSize = settings.bodySize + "pt";
  box.style.lineHeight = settings.lineHeight;
  box.style.setProperty("--caption-size", settings.captionSize + "pt");
  box.style.setProperty("--media-caption-size", settings.mediaCaptionSize + "pt");
  box.style.setProperty("--para-gap", settings.paraGap + "em");
  box.style.setProperty("--align", settings.justify ? "justify" : "left");
  box.innerHTML = html;
  TPP.renderQr(box, settings);
  return box.scrollHeight / 96;
};
TPP.storyTextHtml = function (innerHtml) {
  return '<div class="story-text">' + (innerHtml || "") + "</div>";
};
TPP.qrFigureHtml = function (url) {
  return '<figure class="figure qr-figure qr-figure-separate"><span class="qr-holder" data-url="' + TPP.esc(url || "") + '"></span></figure>';
};
TPP.qrCaptionHtml = function (caption) {
  return caption ? TPP.storyTextHtml("<p>" + TPP.esc(caption) + "</p>") : "";
};
TPP.serializeNodes = function (nodes) {
  const box = document.createElement("div");
  (nodes || []).forEach(function (node) {
    box.appendChild(node.cloneNode(true));
  });
  return box.innerHTML;
};
TPP.splitHtmlText = function (html, settings, maxHeight) {
  const parse = document.createElement("div");
  parse.innerHTML = html || "";
  const story = parse.querySelector(".story-text") || parse;
  const fits = function (innerHtml) {
    return TPP.measureBlock(TPP.storyTextHtml(innerHtml), settings) <= maxHeight;
  };
  const splitTextNode = function (node) {
    const tokens = String(node.textContent || "").match(/\S+\s*|\s+/g) || [node.textContent || ""];
    return tokens.filter(Boolean).map(function (token) {
      return document.createTextNode(token);
    });
  };
  const splitNode = function (node) {
    if (!node) return [];
    if (node.nodeType === Node.TEXT_NODE) return splitTextNode(node);
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const outer = node.outerHTML || "";
    if (outer && fits(outer)) return [node.cloneNode(true)];
    if (!node.childNodes.length) return [node.cloneNode(true)];
    const chunks = [];
    let shell = node.cloneNode(false);
    Array.from(node.childNodes).forEach(function (child) {
      splitNode(child).forEach(function (piece) {
        const test = shell.cloneNode(true);
        test.appendChild(piece.cloneNode(true));
        if (shell.childNodes.length && !fits(test.outerHTML || test.textContent || "")) {
          chunks.push(shell);
          shell = node.cloneNode(false);
        }
        shell.appendChild(piece.cloneNode(true));
      });
    });
    if (shell.childNodes.length) chunks.push(shell);
    return chunks.length ? chunks : [node.cloneNode(true)];
  };

  const chunks = [];
  let current = [];
  Array.from(story.childNodes).forEach(function (child) {
    splitNode(child).forEach(function (piece) {
      const test = current.concat([piece]);
      if (current.length && !fits(TPP.serializeNodes(test))) {
        chunks.push(TPP.storyTextHtml(TPP.serializeNodes(current)));
        current = [];
      }
      current.push(piece.cloneNode(true));
    });
  });
  if (current.length) chunks.push(TPP.storyTextHtml(TPP.serializeNodes(current)));
  return chunks.length ? chunks : [TPP.storyTextHtml(story.innerHTML)];
};
TPP.parseChapterMetadata = function (chapter) {
  let text = String((chapter && chapter.text) || "").trim();
  if (!text) return null;
  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  text = text.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
  try {
    const meta = JSON.parse(text);
    if (!meta || meta.type !== "blank") return meta || null;
    return {
      type: "blank",
      pages: Math.max(0, Math.min(500, Math.floor(Number(meta.pages) || 0)))
    };
  } catch {
    return null;
  }
};
TPP.fitChapterOrnament = function (html, ornament, maxHeight, settings) {
  const inlineOrnament = ornament.replace('class="chapter-end"', 'class="chapter-end inline"');
  const inlineAtParagraphEnd = /<\/p>\s*$/i.test(html) ? html.replace(/(<\/p>\s*)$/i, " " + inlineOrnament + "$1") : "";
  const inlineAtEnd = html ? html + " " + inlineOrnament : inlineOrnament;
  if (TPP.measureBlock(html + ornament, settings) <= maxHeight) return html + ornament;
  if (inlineAtParagraphEnd && TPP.measureBlock(inlineAtParagraphEnd, settings) <= maxHeight) return inlineAtParagraphEnd;
  if (TPP.measureBlock(inlineAtEnd, settings) <= maxHeight) return inlineAtEnd;
  return "";
};
TPP.appendQrCaptionPages = function (pages, settings, maxHeight, makePage, baseHtml, caption) {
  const captionHtml = TPP.qrCaptionHtml(caption);
  makePage("qr-page", baseHtml);
  if (!captionHtml) return;
  TPP.splitHtmlText(captionHtml, settings, maxHeight).forEach(function (part) {
    if (TPP.measureBlock(part, settings) > 0.01) makePage("text", part);
  });
};
TPP.buildPages = function () {
  const settings = TPP.settings();
  const pages = [];
  const series = [settings.seriesName, settings.number].filter(Boolean).join(" ");
  const maxHeight = Math.max(0.05, settings.page.h - 2 * settings.margin - 0.07);
  const makePage = function (type, html, extra) {
    pages.push(Object.assign({ n: pages.length + 1, type, html }, extra || {}));
  };

  makePage("cover", TPP.coverHTML(settings, "front"), { cover: true, role: "front" });
  makePage("inside", "", { role: "inside-front" });
  makePage("title-page", '<div class="story-title">' + TPP.esc(settings.title) + '</div><div class="meta">' + (settings.author ? "By " + TPP.esc(settings.author) + "<br>" : "") + TPP.esc(series) + "</div>");
  makePage("imprint", '<div class="story-title">Publication</div><div class="imprint">' + [settings.title, settings.author, settings.publisher, TPP.date(settings.pubDate), settings.printing, settings.volume, settings.number, settings.copyright].filter(Boolean).map(TPP.esc).join("<br>") + "</div>");

  let tocIndex = -1;
  if (settings.includeToc) {
    tocIndex = pages.length;
    makePage("toc", '<div class="story-title">Contents</div><ol class="toc-list"></ol>');
  }

  const toc = [];
  settings.chapters.forEach(function (chapter, index) {
    const startPage = pages.length + 1;
    const chapterStartIndex = pages.length;
    let heading = '<div class="chapter-heading">' + TPP.esc(chapter.title || "") + "</div>";

    if (chapter.isMetadata) {
      const meta = TPP.parseChapterMetadata(chapter);
      if (meta && meta.type === "blank") {
        for (let i = 0; i < meta.pages; i++) {
          makePage("chapter-blank", i === 0 ? heading : "", { chapterTitle: chapter.title || "Chapter " + (index + 1) });
        }
      } else {
        makePage("text", heading + '<div class="story-text"><p>Invalid metadata JSON.</p></div>');
      }
      if (chapter.includeInToc !== false) {
        toc.push({ title: chapter.tocTitle || chapter.title || "Chapter " + (index + 1), chapter: index + 1, page: startPage, level: chapter.level || 0 });
      }
      return;
    }

    if (chapter.imageData && chapter.imagePlacement !== "none") {
      const imageHtml = '<figure class="figure image-figure"><img src="' + chapter.imageData + '" style="width:' + Math.min(100, Math.max(10, Number(chapter.imageWidth) || 70)) + '%"><figcaption class="caption"></figcaption></figure>';
      if (chapter.imagePlacement === "own") {
        makePage("chapter-image", heading + imageHtml);
        heading = "";
      } else heading += imageHtml;
    }

    let pending = heading;
    TPP.blocksFromText(chapter.text, settings).forEach(function (block) {
      if (settings.qrDisplayMode === "separate" && block.type === "qr") {
        let qrHtml = TPP.qrFigureHtml(block.url);
        if (pending && TPP.measureBlock(pending + qrHtml, settings) <= maxHeight) {
          qrHtml = pending + qrHtml;
        } else if (pending) {
          makePage("text", pending);
        }
        pending = "";
        TPP.appendQrCaptionPages(pages, settings, maxHeight, makePage, qrHtml, block.caption);
        return;
      }
      const combinedHeight = TPP.measureBlock(pending + block.html, settings);
      if (combinedHeight <= maxHeight) {
        pending += block.html;
        return;
      }
      if (pending) makePage("text", pending);
      pending = "";
      const blockHeight = TPP.measureBlock(block.html, settings);
      if (blockHeight <= maxHeight) {
        pending = block.html;
      } else if (block.type === "html") {
        TPP.splitHtmlText(block.html, settings, maxHeight).forEach(function (part) {
          makePage("text", part);
        });
      } else {
        makePage("text", '<div class="story-text smallfit">' + block.html + "</div>");
      }
    });

    if (settings.chapterEndOrnament) {
      const preferred = '<span class="chapter-end' + (settings.chapterEndCentered ? "" : " inline") + '">' + TPP.esc(settings.chapterEndOrnament) + "</span>";
      const fittedPending = pending ? TPP.fitChapterOrnament(pending, preferred, maxHeight, settings) : "";
      if (fittedPending) {
        pending = fittedPending;
      } else if (pages.length > chapterStartIndex) {
        const last = pages[pages.length - 1];
        const fittedLast = last && !last.cover ? TPP.fitChapterOrnament(last.html || "", preferred, maxHeight, settings) : "";
        if (fittedLast) {
          last.html = fittedLast;
        } else {
          if (pending) makePage("text", pending);
          pending = preferred;
        }
      } else {
        if (pending) makePage("text", pending);
        pending = preferred;
      }
    }
    if (pending) makePage("text", pending);

    if (chapter.includeInToc !== false) {
      toc.push({ title: chapter.tocTitle || chapter.title || "Chapter " + (index + 1), chapter: index + 1, page: startPage, level: chapter.level || 0 });
    }
  });

  if (tocIndex >= 0) {
    const leaderClass = settings.tocLeader === "line" ? "line" : settings.tocLeader === "none" ? "none" : "";
    pages[tocIndex].html = '<div class="story-title">Contents</div><ol class="toc-list">' + toc.map(function (row) {
      const number = settings.tocNumberType === "chapter" ? row.chapter : row.page;
      return '<li style="padding-left:' + ((row.level || 0) * 0.12) + 'in"><span class="toc-main"><span class="toc-title">' + TPP.esc(row.title) + '</span><span class="leader ' + leaderClass + '"></span></span><span class="toc-page">' + number + "</span></li>";
    }).join("") + "</ol>";
  }

  makePage("inside", "", { role: "inside-back" });
  makePage("back", TPP.coverHTML(settings, "back"), { cover: true, role: "back" });

  while (pages.length % 4 !== 0) {
    pages.splice(pages.length - 1, 0, { n: 0, type: "blank", html: "" });
  }
  pages.forEach(function (page, index) { page.n = index + 1; });
  TPP.lastPages = pages;
  return pages;
};
