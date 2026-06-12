window.TPP = window.TPP || {};

TPP.pdfMetadata = function (book, options) {
  const source = book || {};
  const exportKind = String((options && options.kind) || "").trim();
  const baseTitle = String(source.title || "Untitled").trim() || "Untitled";
  const subtitle = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subtitle")
      : source.subtitle || "",
  ).trim();
  const author = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "author")
      : source.author || "",
  ).trim();
  const publisher = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "publisher")
      : source.publisher || "",
  ).trim();
  const pubDate = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "pubDate")
      : source.pubDate || "",
  ).trim();
  const classification = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "classification")
      : source.classification || "",
  ).trim();
  const explicitSubject = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subject")
      : source.subject || "",
  ).trim();
  const description = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "description")
      : source.description || "",
  ).trim();
  const explicitKeywords = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "keywords")
      : source.keywords || "",
  ).trim();
  const title = subtitle ? baseTitle + ": " + subtitle : baseTitle;
  const derivedSubjectPieces = [classification, publisher, pubDate].filter(
    Boolean,
  );
  if (exportKind) derivedSubjectPieces.unshift(exportKind + " export");
  const subject = explicitSubject || description || derivedSubjectPieces.join(" · ");
  const keywords = Array.from(
    new Set(
      explicitKeywords
        .split(/[,;\n]+/)
        .map(function (item) {
          return String(item || "").trim();
        })
        .concat([
          baseTitle,
          subtitle,
          author,
          publisher,
          explicitSubject,
          classification,
        ])
        .filter(Boolean),
    ),
  ).join(", ");
  return {
    title: title,
    author: author,
    subject: subject,
    keywords: keywords,
    creator: "Tiny Pockets Press",
    producer: "Tiny Pockets Press",
  };
};
TPP.applyPdfMetadata = function (pdf, book, options) {
  if (!pdf || typeof pdf.setProperties !== "function") return;
  const metadata = TPP.pdfMetadata(book, options);
  pdf.setProperties(metadata);
  if (typeof pdf.setCreationDate === "function") {
    try {
      pdf.setCreationDate(new Date());
    } catch (_error) {}
  }
};
TPP.waitForImages = async function (root) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        const done = function () {
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
};

TPP.exportPdfFrom = async function (which) {
  TPP.switchView(which);
  if (which === "interior") TPP.renderInterior();
  else TPP.renderCover();

  const settings = TPP.settings();
  const container =
    which === "interior"
      ? document.getElementById("interiorPreview")
      : document.getElementById("coverPreview");
  const pdf = new jspdf.jsPDF({
    orientation:
      settings.sheet.h >= settings.sheet.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.sheet.w, settings.sheet.h],
    compress: true,
  });
  TPP.applyPdfMetadata(pdf, settings, { kind: which + " pdf" });
  const sheets = Array.from(container.querySelectorAll("[data-pdf-page]"));
  for (let i = 0; i < sheets.length; i++) {
    TPP.showProgress(
      5 + Math.round((i / sheets.length) * 90),
      "Rendering " +
        which +
        " PDF page " +
        (i + 1) +
        " of " +
        sheets.length +
        "…",
    );
    const el = sheets[i];
    const oldTransform = el.style.transform;
    const oldMargin = el.style.marginBottom;
    el.style.transform = "none";
    el.style.marginBottom = "0";
    TPP.renderQr(el, settings);
    await TPP.waitForImages(el);
    await new Promise(requestAnimationFrame);
    const canvas = await html2canvas(
      el,
      TPP.html2canvasOptions({ scale: 3 }),
    );
    if (i) pdf.addPage([settings.sheet.w, settings.sheet.h]);
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      settings.sheet.w,
      settings.sheet.h,
    );
    el.style.transform = oldTransform;
    el.style.marginBottom = oldMargin;
    await new Promise(requestAnimationFrame);
  }
  const name =
    (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-") +
    "-" +
    which +
    ".pdf";
  pdf.save(name);
  TPP.showProgress(100, "PDF complete");
};
TPP.exportReadablePdf = async function () {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const pdf = new jspdf.jsPDF({
    orientation: settings.page.h >= settings.page.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.page.w, settings.page.h],
    compress: true,
  });
  TPP.applyPdfMetadata(pdf, settings, { kind: "ebook pdf" });
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 90),
        "Rendering eBook PDF page " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      const pageEl = TPP.pageEl(page, settings, 0, 0, false, true);
      shell.appendChild(pageEl);
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: 3 }),
      );
      if (i) pdf.addPage([settings.page.w, settings.page.h]);
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        settings.page.w,
        settings.page.h,
      );
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
  } finally {
    mount.remove();
  }
  const name =
    (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-") +
    "-ebook.pdf";
  pdf.save(name);
  TPP.showProgress(100, "eBook PDF complete");
};
TPP.epubEscape = function (value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};
TPP.epubFileStem = function (value) {
  return (
    String(value || "tiny-book")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tiny-book"
  );
};
TPP.epubNowIso = function () {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
};
TPP.epubMediaType = function (file) {
  const type = String((file && file.type) || "").trim().toLowerCase();
  if (type) return type;
  const name = String((file && file.name) || "").toLowerCase();
  if (/\.jpe?g$/.test(name)) return "image/jpeg";
  if (/\.png$/.test(name)) return "image/png";
  if (/\.gif$/.test(name)) return "image/gif";
  if (/\.webp$/.test(name)) return "image/webp";
  if (/\.svg$/.test(name)) return "image/svg+xml";
  if (/^data:image\/svg\+xml/i.test(String((file && file.data) || "")))
    return "image/svg+xml";
  if (/^data:image\/png/i.test(String((file && file.data) || "")))
    return "image/png";
  if (/^data:image\/jpe?g/i.test(String((file && file.data) || "")))
    return "image/jpeg";
  if (/^data:image\/gif/i.test(String((file && file.data) || "")))
    return "image/gif";
  if (/^data:image\/webp/i.test(String((file && file.data) || "")))
    return "image/webp";
  return "application/octet-stream";
};
TPP.epubExtensionForMime = function (mime) {
  const type = String(mime || "").toLowerCase();
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/gif") return "gif";
  if (type === "image/webp") return "webp";
  if (type === "image/svg+xml") return "svg";
  return "bin";
};
TPP.epubArrayBufferFromData = async function (value) {
  if (!value) return new ArrayBuffer(0);
  const response = await fetch(String(value));
  return await response.arrayBuffer();
};
TPP.epubChapterHref = function (index) {
  return "text/chapter-" + String(index + 1).padStart(3, "0") + ".xhtml";
};
TPP.epubStylesheet = function () {
  return [
    "body {",
    "  margin: 0;",
    "  padding: 0;",
    "  font-family: Georgia, serif;",
    "  line-height: 1.5;",
    "  color: #111;",
    "  background: #fff;",
    "}",
    "main {",
    "  max-width: 42rem;",
    "  margin: 0 auto;",
    "  padding: 1.5rem 1.25rem 2rem;",
    "}",
    "h1, h2, h3 {",
    "  line-height: 1.2;",
    "  margin: 0 0 0.85rem;",
    "}",
    "h1 { font-size: 1.8rem; }",
    "h2 { font-size: 1.45rem; }",
    "p { margin: 0 0 0.95rem; }",
    ".title-page { text-align: center; padding-top: 10vh; }",
    ".title-page .cover { margin: 0 auto 1.5rem; }",
    ".title-page img { max-width: 100%; max-height: 60vh; }",
    ".meta, .imprint, .toc-note { color: #444; }",
    ".meta p, .imprint p { margin: 0.25rem 0; }",
    ".story-text { margin: 0 0 1rem; }",
    ".story-text > :last-child { margin-bottom: 0; }",
    "figure { margin: 1rem 0 1.25rem; text-align: center; }",
    "img { max-width: 100%; height: auto; }",
    "figcaption {",
    "  margin-top: 0.45rem;",
    "  font-size: 0.92rem;",
    "  color: #555;",
    "}",
    "nav ol { padding-left: 1.25rem; }",
    "nav li { margin: 0.35rem 0; }",
    "a { color: #0b4ea2; text-decoration: none; }",
    ".external-link { word-break: break-word; }",
  ].join("\n");
};
TPP.epubXhtmlSafeHtml = function (html) {
  return String(html || "")
    .replace(/<br(\s*)>/gi, "<br$1 />")
    .replace(/<hr(\s*)>/gi, "<hr$1 />")
    .replace(/<img([^>]*)>/gi, function (match, attrs) {
      return /\/\s*>$/.test(match) ? match : "<img" + attrs + " />";
    });
};
TPP.epubWrapXhtml = function (title, body) {
  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!DOCTYPE html>\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">\n' +
    "<head>\n" +
    '  <meta charset="utf-8" />\n' +
    "  <title>" +
    TPP.epubEscape(title || "") +
    "</title>\n" +
    '  <link rel="stylesheet" type="text/css" href="../styles/book.css" />\n' +
    "</head>\n" +
    "<body>\n" +
    "<main>\n" +
    TPP.epubXhtmlSafeHtml(body) +
    "\n</main>\n" +
    "</body>\n" +
    "</html>\n"
  );
};
TPP.epubFlushMarkdownBuffer = function (buffer, out) {
  if (!buffer.length) return;
  const markdown = buffer.join("\n");
  if (markdown.trim()) {
    out.push('<div class="story-text">' + TPP.safeMarkdown(markdown) + "</div>");
  }
  buffer.length = 0;
};
TPP.epubChapterContentHtml = function (chapter, settings) {
  const parts = [];
  const buffer = [];
  TPP.extractLines((chapter && chapter.text) || "").forEach(function (item) {
    if (item.type === "text") {
      buffer.push(item.text);
      return;
    }
    TPP.epubFlushMarkdownBuffer(buffer, parts);
    const caption = String(item.caption || "").trim();
    if (item.type === "imageUrl" && settings.imageUrlMode === "image") {
      parts.push(
        '<figure class="external-link"><img src="' +
          TPP.epubEscape(item.url) +
          '" alt="' +
          TPP.epubEscape(caption || "Chapter image") +
          '" />' +
          (caption
            ? "<figcaption>" + TPP.epubEscape(caption) + "</figcaption>"
            : "") +
          "</figure>",
      );
      return;
    }
    parts.push(
      '<div class="story-text external-link"><p><a href="' +
        TPP.epubEscape(item.url) +
        '">' +
        TPP.epubEscape(item.url) +
        "</a></p>" +
        (caption ? "<p>" + TPP.epubEscape(caption) + "</p>" : "") +
        "</div>",
    );
  });
  TPP.epubFlushMarkdownBuffer(buffer, parts);
  return parts.join("\n");
};
TPP.epubTitlePageBody = function (settings, coverHref) {
  const series = [settings.seriesName, settings.number].filter(Boolean).join(" ");
  const lines = [];
  if (settings.author) lines.push("<p>By " + TPP.epubEscape(settings.author) + "</p>");
  if (series) lines.push("<p>" + TPP.epubEscape(series) + "</p>");
  if (settings.publisher)
    lines.push("<p>Published by " + TPP.epubEscape(settings.publisher) + "</p>");
  if (settings.pubDate)
    lines.push("<p>" + TPP.epubEscape(TPP.formatBookDate(settings.pubDate)) + "</p>");
  return (
    '<section class="title-page">' +
    (coverHref
      ? '<div class="cover"><img src="../' +
        TPP.epubEscape(coverHref) +
        '" alt="' +
        TPP.epubEscape(settings.title || "Cover") +
        '" /></div>'
      : "") +
    "<h1>" +
    TPP.epubEscape(settings.title || "Untitled") +
    "</h1>" +
    (lines.length ? '<div class="meta">' + lines.join("") + "</div>" : "") +
    "</section>"
  );
};
TPP.epubCopyrightBody = function (settings) {
  const lines = TPP.textElementsForLocation(settings, "copyright")
    .map(function (item) {
      return TPP.copyrightPageItemText(settings, item);
    })
    .filter(Boolean);
  return (
    "<section>" +
    "<h1>" +
    TPP.epubEscape(settings.copyrightPageTitle || "Copyright") +
    "</h1>" +
    '<div class="imprint">' +
    lines
      .map(function (line) {
        return "<p>" + TPP.epubEscape(line) + "</p>";
      })
      .join("") +
    "</div>" +
    "</section>"
  );
};
TPP.epubNavBody = function (items) {
  return (
    "<section>" +
    "<h1>Contents</h1>" +
    (items.length
      ? '<nav epub:type="toc" id="toc"><ol>' +
        items
          .map(function (item) {
            return (
              "<li><a href=\"" +
              TPP.epubEscape(item.href) +
              "\">" +
              TPP.epubEscape(item.label) +
              "</a></li>"
            );
          })
          .join("") +
        "</ol></nav>"
      : '<p class="toc-note">No table of contents entries available.</p>') +
    "</section>"
  );
};
TPP.epubMetadata = function (book) {
  const source = book || {};
  const title = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "title")
      : source.title || "Untitled",
  ).trim() || "Untitled";
  const subtitle = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subtitle")
      : source.subtitle || "",
  ).trim();
  const creator = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "author")
      : source.author || "",
  ).trim();
  const publisher = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "publisher")
      : source.publisher || "",
  ).trim();
  const date = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "pubDate")
      : source.pubDate || "",
  ).trim();
  const language = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "language")
      : source.language || "",
  ).trim()
    .toLowerCase();
  const region = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "region")
      : source.region || "",
  ).trim()
    .toUpperCase();
  const subject = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subject")
      : source.subject || "",
  ).trim();
  const description = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "description")
      : source.description || "",
  ).trim();
  const classification = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "classification")
      : source.classification || "",
  ).trim();
  const rights = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "copyright")
      : source.copyright || "",
  ).trim();
  const isbn13 = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "isbn13")
      : source.isbn13 || "",
  ).trim();
  const isbn = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "isbn")
      : source.isbn || "",
  ).trim();
  const keywords = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "keywords")
      : source.keywords || "",
  )
    .split(/[,;\n]+/)
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean);
  const subjects = Array.from(
    new Set([subject, classification].concat(keywords).filter(Boolean)),
  );
  const languageTag = language
    ? region
      ? language + "-" + region
      : language
    : "en";
  return {
    identifier:
      isbn13 ||
      isbn ||
      String(source.meta && source.meta.id ? source.meta.id : TPP.uid()),
    title: subtitle ? title + ": " + subtitle : title,
    creator: creator,
    publisher: publisher,
    date: date,
    language: languageTag,
    description: description,
    subjects: subjects,
    rights: rights,
    modified: TPP.epubNowIso(),
  };
};
TPP.epubPackageDocument = function (metadata, manifest, spine) {
  return (
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">\n' +
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
    "    <dc:identifier id=\"bookid\">" +
    TPP.epubEscape(metadata.identifier) +
    "</dc:identifier>\n" +
    "    <dc:title>" +
    TPP.epubEscape(metadata.title) +
    "</dc:title>\n" +
    "    <dc:language>" +
    TPP.epubEscape(metadata.language || "en") +
    "</dc:language>\n" +
    (metadata.creator
      ? "    <dc:creator>" +
        TPP.epubEscape(metadata.creator) +
        "</dc:creator>\n"
      : "") +
    (metadata.publisher
      ? "    <dc:publisher>" +
        TPP.epubEscape(metadata.publisher) +
        "</dc:publisher>\n"
      : "") +
    (metadata.date
      ? "    <dc:date>" + TPP.epubEscape(metadata.date) + "</dc:date>\n"
      : "") +
    (metadata.description
      ? "    <dc:description>" +
        TPP.epubEscape(metadata.description) +
        "</dc:description>\n"
      : "") +
    ((Array.isArray(metadata.subjects) ? metadata.subjects : []).length
      ? (metadata.subjects || [])
          .map(function (subject) {
            return (
              "    <dc:subject>" + TPP.epubEscape(subject) + "</dc:subject>\n"
            );
          })
          .join("")
      : "") +
    (metadata.rights
      ? "    <dc:rights>" + TPP.epubEscape(metadata.rights) + "</dc:rights>\n"
      : "") +
    '    <meta property="dcterms:modified">' +
    TPP.epubEscape(metadata.modified) +
    "</meta>\n" +
    "  </metadata>\n" +
    "  <manifest>\n" +
    manifest.join("\n") +
    "\n  </manifest>\n" +
    "  <spine>\n" +
    spine.join("\n") +
    "\n  </spine>\n" +
    "</package>\n"
  );
};
TPP.exportEpub = async function () {
  TPP.sync();
  const settings = TPP.settings();
  if (!window.JSZip) {
    alert("EPUB export library failed to load.");
    return;
  }
  const zip = new JSZip();
  const manifest = [];
  const spine = [];
  const tocItems = [];
  const imageRefs = Object.create(null);
  const stem = TPP.epubFileStem(settings.title || "tiny-book");
  const identifier =
    "urn:tpp:" +
    (TPP.bookId(settings) || stem) +
    ":" +
    TPP.hashString(JSON.stringify({ title: settings.title, updatedAt: TPP.bookUpdatedAt(settings) }));
  const addManifestItem = function (id, href, mediaType, properties) {
    manifest.push(
      '    <item id="' +
        TPP.epubEscape(id) +
        '" href="' +
        TPP.epubEscape(href) +
        '" media-type="' +
        TPP.epubEscape(mediaType) +
        '"' +
        (properties ? ' properties="' + TPP.epubEscape(properties) + '"' : "") +
        " />",
    );
  };
  const addSpineItem = function (id) {
    spine.push('    <itemref idref="' + TPP.epubEscape(id) + '" />');
  };
  const addDocument = function (id, href, title, body, properties) {
    zip.file("EPUB/" + href, TPP.epubWrapXhtml(title, body));
    addManifestItem(id, href, "application/xhtml+xml", properties);
    addSpineItem(id);
  };
  const ensureImage = async function (fileId, prefix) {
    const id = String(fileId || "").trim();
    if (!id) return null;
    if (imageRefs[id]) return imageRefs[id];
    const file = TPP.fileAsset(settings, id);
    if (!file || !file.data) return null;
    const mime = TPP.epubMediaType(file);
    const ext = TPP.epubExtensionForMime(mime);
    const href =
      "images/" +
      TPP.epubFileStem(prefix || file.name || id || "image") +
      "-" +
      Object.keys(imageRefs).length +
      "." +
      ext;
    const bytes = await TPP.epubArrayBufferFromData(file.data);
    const ref = {
      id: "img-" + Object.keys(imageRefs).length,
      href: href,
      mime: mime,
      title: file.name || prefix || "Image",
    };
    zip.file("EPUB/" + href, bytes);
    addManifestItem(ref.id, href, mime, "");
    imageRefs[id] = ref;
    return ref;
  };
  const chapterImageMarkup = function (imageRef, chapter) {
    if (!imageRef) return "";
    return (
      '<figure><img src="../' +
      TPP.epubEscape(imageRef.href) +
      '" alt="' +
      TPP.epubEscape((chapter && chapter.title) || "Chapter image") +
      '" /></figure>'
    );
  };

  TPP.showProgress(5, "Preparing EPUB package...");
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
      "  <rootfiles>\n" +
      '    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>\n' +
      "  </rootfiles>\n" +
      "</container>\n",
  );
  zip.file("EPUB/styles/book.css", TPP.epubStylesheet());
  addManifestItem("css", "styles/book.css", "text/css", "");

  const frontImageElement = TPP.findImageElement(settings, "front", "cover");
  const coverImage = await ensureImage(
    frontImageElement && frontImageElement.fileId,
    "cover",
  );
  if (coverImage) {
    manifest[manifest.length - 1] = manifest[manifest.length - 1].replace(
      " />",
      ' properties="cover-image" />',
    );
  }

  addDocument(
    "title-page",
    "text/title.xhtml",
    settings.title || "Title",
    TPP.epubTitlePageBody(settings, coverImage && coverImage.href),
    "",
  );
  tocItems.push({ href: "title.xhtml", label: settings.title || "Title Page" });

  if (settings.copyrightPageEnabled) {
    addDocument(
      "copyright-page",
      "text/copyright.xhtml",
      settings.copyrightPageTitle || "Copyright",
      TPP.epubCopyrightBody(settings),
      "",
    );
  }

  const chapterList = Array.isArray(settings.chapters) ? settings.chapters : [];
  for (let i = 0; i < chapterList.length; i++) {
    const chapter = chapterList[i];
    if (!chapter || chapter.isMetadata) continue;
    TPP.showProgress(
      15 + Math.round((i / Math.max(1, chapterList.length)) * 60),
      "Building EPUB chapter " + (i + 1) + " of " + chapterList.length + "...",
    );
    const chapterTitle = chapter.title || "Chapter " + (i + 1);
    const chapterImageElement = TPP.findChapterImageElement(settings, chapter);
    const chapterImage = await ensureImage(
      chapterImageElement && chapterImageElement.fileId,
      "chapter-" + (i + 1),
    );
    const body =
      "<section>" +
      "<h2>" +
      TPP.epubEscape(chapterTitle) +
      "</h2>" +
      chapterImageMarkup(chapterImage, chapter) +
      TPP.epubChapterContentHtml(chapter, settings) +
      "</section>";
    addDocument(
      "chapter-" + String(i + 1),
      TPP.epubChapterHref(i),
      chapterTitle,
      body,
      "",
    );
    if (chapter.includeInToc !== false) {
      tocItems.push({
        href: TPP.epubChapterHref(i).replace(/^text\//, ""),
        label: chapter.tocTitle || chapterTitle,
      });
    }
  }

  zip.file(
    "EPUB/text/nav.xhtml",
    TPP.epubWrapXhtml("Contents", TPP.epubNavBody(tocItems)),
  );
  addManifestItem("nav", "text/nav.xhtml", "application/xhtml+xml", "nav");
  spine.splice(1, 0, '    <itemref idref="nav" />');

  TPP.showProgress(82, "Assembling EPUB package...");
  zip.file(
    "EPUB/package.opf",
    TPP.epubPackageDocument(
      TPP.epubMetadata(settings),
      manifest,
      spine,
    ),
  );

  const blob = await zip.generateAsync(
    { type: "blob", mimeType: "application/epub+zip", compression: "DEFLATE" },
    function (meta) {
      TPP.showProgress(
        82 + Math.round(meta.percent * 0.18),
        "Compressing EPUB package...",
      );
    },
  );
  TPP.downloadBlob(stem + ".epub", blob);
  TPP.showProgress(100, "EPUB complete");
};
TPP.imageExportOptions = function (options) {
  const source = options || {};
  const requestedFormat = ["png", "gif", "jpeg", "webp"].includes(source.format)
    ? source.format
    : "png";
  const requestedDepth = [
    "color24",
    "gray8",
    "mono1",
    "indexed",
    "websafe",
  ].includes(source.colorDepth)
    ? source.colorDepth
    : "color24";
  const colorDepth = requestedDepth === "websafe" ? "indexed" : requestedDepth;
  return {
    dpi: TPP.dpi(source.dpi),
    format:
      colorDepth === "indexed" && !["png", "gif"].includes(requestedFormat)
        ? "png"
        : requestedFormat,
    quality: Math.max(1, Math.min(100, Number(source.quality) || 92)),
    colorDepth: colorDepth,
    threshold: Math.max(0, Math.min(255, Number(source.threshold) || 128)),
    frameDelay: Math.max(
      1000,
      Math.min(10000, Number(source.frameDelay) || 1000),
    ),
    palette:
      requestedDepth === "websafe"
        ? "websafe"
        : TPP.imageExportPaletteIds().includes(source.palette)
          ? String(source.palette)
          : "websafe",
  };
};
TPP.IMAGE_EXPORT_PALETTE_SCHEMA_VERSION = 1;
TPP.IMAGE_EXPORT_PALETTE_ITEM_SCHEMA_VERSION = 1;
TPP.IMAGE_EXPORT_PALETTE_CATALOG = "data/palettes.catalog.json";
TPP.imageExportPaletteById = TPP.imageExportPaletteById || {};
TPP.imageExportPaletteIdsCached = TPP.imageExportPaletteIdsCached || [];
TPP.imageExportPaletteCatalogById = TPP.imageExportPaletteCatalogById || {};
TPP.imageExportPaletteCatalogLoadPromise = null;
TPP.imageExportPaletteLoadPromises = TPP.imageExportPaletteLoadPromises || {};
TPP.imageExportPaletteIdsDefault = [
  "websafe",
  "colors4",
  "colors8",
  "colors16",
  "colors32",
  "colors64",
  "colors128",
  "colors256",
  "gray4",
  "gray8",
  "gray16",
  "gray32",
  "gray64",
  "gray128",
  "gray256",
  "windows16",
  "ansi16",
  "xterm256",
  "ega16",
  "atari400base",
  "atari400",
  "cga0",
  "cga1",
];
TPP.fallbackWebsafePalette = function () {
  const websafe = [];
  [0, 51, 102, 153, 204, 255].forEach(function (r) {
    [0, 51, 102, 153, 204, 255].forEach(function (g) {
      [0, 51, 102, 153, 204, 255].forEach(function (b) {
        websafe.push([r, g, b]);
      });
    });
  });
  return websafe;
};
TPP.hexToRgbSwatch = function (value) {
  const hex = String(value || "").trim();
  const match = /^#?([a-fA-F0-9]{6})$/.exec(hex);
  if (!match) return null;
  const full = match[1];
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};
TPP.imageExportPaletteIds = function () {
  if (TPP.imageExportPaletteIdsCached.length)
    return TPP.imageExportPaletteIdsCached.slice();
  return TPP.imageExportPaletteIdsDefault.slice();
};
TPP.loadImageExportPaletteCatalog = async function () {
  const response = await fetch(TPP.IMAGE_EXPORT_PALETTE_CATALOG, {
    cache: "no-cache",
  });
  if (!response.ok)
    throw new Error("Palette catalog load failed: " + response.status);
  const payload = await response.json();
  if (
    !payload ||
    Number(payload.schemaVersion) !== TPP.IMAGE_EXPORT_PALETTE_SCHEMA_VERSION ||
    !Array.isArray(payload.palettes)
  )
    throw new Error("Palette catalog schema mismatch");
  const catalogMap = {};
  const ids = [];
  payload.palettes.forEach(function (entry) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof entry.file !== "string"
    )
      return;
    const id = entry.id.trim();
    if (!id) return;
    catalogMap[id] = {
      id: id,
      name: typeof entry.name === "string" ? entry.name : id,
      file: entry.file,
    };
    ids.push(id);
  });
  const uniqueIds = Array.from(new Set(ids));
  TPP.imageExportPaletteCatalogById = catalogMap;
  TPP.imageExportPaletteIdsCached = uniqueIds.includes("websafe")
    ? uniqueIds
    : ["websafe"].concat(uniqueIds);
  return catalogMap;
};
TPP.ensureImageExportPaletteCatalogLoaded = async function () {
  if (TPP.imageExportPaletteIdsCached.length) return;
  if (!TPP.imageExportPaletteCatalogLoadPromise) {
    TPP.imageExportPaletteCatalogLoadPromise =
      TPP.loadImageExportPaletteCatalog()
        .catch(function (_error) {
          TPP.imageExportPaletteById = {
            websafe: TPP.fallbackWebsafePalette(),
          };
          TPP.imageExportPaletteCatalogById = {};
          TPP.imageExportPaletteIdsCached = ["websafe"];
        })
        .finally(function () {
          TPP.imageExportPaletteCatalogLoadPromise = null;
        });
  }
  await TPP.imageExportPaletteCatalogLoadPromise;
};
TPP.loadImageExportPaletteById = async function (id) {
  const paletteId = String(id || "websafe").trim() || "websafe";
  if (TPP.imageExportPaletteById[paletteId])
    return TPP.imageExportPaletteById[paletteId];
  await TPP.ensureImageExportPaletteCatalogLoaded();
  const meta = TPP.imageExportPaletteCatalogById[paletteId];
  if (!meta || !meta.file) {
    if (paletteId === "websafe") {
      TPP.imageExportPaletteById.websafe = TPP.fallbackWebsafePalette();
      return TPP.imageExportPaletteById.websafe;
    }
    return TPP.loadImageExportPaletteById("websafe");
  }
  const fileResponse = await fetch(meta.file, { cache: "no-cache" });
  if (!fileResponse.ok)
    throw new Error(
      "Palette file load failed: " + paletteId + " " + fileResponse.status,
    );
  const palettePayload = await fileResponse.json();
  if (
    !palettePayload ||
    Number(palettePayload.schemaVersion) !==
      TPP.IMAGE_EXPORT_PALETTE_ITEM_SCHEMA_VERSION ||
    palettePayload.id !== paletteId ||
    !Array.isArray(palettePayload.colors)
  ) {
    throw new Error("Palette file schema mismatch: " + paletteId);
  }
  const colors = palettePayload.colors.map(TPP.hexToRgbSwatch).filter(Boolean);
  if (!colors.length)
    throw new Error("Palette file has no colors: " + paletteId);
  TPP.imageExportPaletteById[paletteId] = colors;
  return colors;
};
TPP.ensureImageExportPaletteLoaded = async function (id) {
  const paletteId = String(id || "websafe").trim() || "websafe";
  if (TPP.imageExportPaletteById[paletteId]) return;
  if (!TPP.imageExportPaletteLoadPromises[paletteId]) {
    TPP.imageExportPaletteLoadPromises[paletteId] =
      TPP.loadImageExportPaletteById(paletteId)
        .catch(function () {
          if (!TPP.imageExportPaletteById.websafe) {
            TPP.imageExportPaletteById.websafe = TPP.fallbackWebsafePalette();
          }
          if (paletteId !== "websafe") {
            TPP.imageExportPaletteById[paletteId] =
              TPP.imageExportPaletteById.websafe;
          }
        })
        .finally(function () {
          delete TPP.imageExportPaletteLoadPromises[paletteId];
        });
  }
  await TPP.imageExportPaletteLoadPromises[paletteId];
};
TPP.ensureImageExportPaletteForOptionsLoaded = async function (options) {
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.colorDepth !== "indexed") return;
  await TPP.ensureImageExportPaletteLoaded(exportOptions.palette || "websafe");
};
TPP.imageExportNamedPalette = function (name) {
  const id = String(name || "websafe");
  if (TPP.imageExportPaletteById[id]) return TPP.imageExportPaletteById[id];
  if (TPP.imageExportPaletteById.websafe)
    return TPP.imageExportPaletteById.websafe;
  return TPP.fallbackWebsafePalette();
};
TPP.applyIndexedPalette = function (data, palette) {
  const cache = new Map();
  const nearest = function (r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    if (cache.has(key)) return cache.get(key);
    let best = palette[0] || [0, 0, 0];
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const swatch = palette[i];
      const dr = r - swatch[0];
      const dg = g - swatch[1];
      const db = b - swatch[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = swatch;
        if (dist === 0) break;
      }
    }
    cache.set(key, best);
    return best;
  };
  for (let i = 0; i < data.length; i += 4) {
    const match = nearest(data[i], data[i + 1], data[i + 2]);
    data[i] = match[0];
    data[i + 1] = match[1];
    data[i + 2] = match[2];
  }
};
TPP.canvasRgba = function (canvas) {
  const readCanvas = document.createElement("canvas");
  readCanvas.width = canvas.width;
  readCanvas.height = canvas.height;
  const readCtx = readCanvas.getContext("2d", { willReadFrequently: true });
  readCtx.drawImage(canvas, 0, 0);
  return readCtx.getImageData(0, 0, canvas.width, canvas.height).data;
};
TPP.gifPaletteForExport = function (rgba, exportOptions, lib, transparent) {
  const reserve = transparent ? 1 : 0;
  if (exportOptions.colorDepth === "mono1")
    return TPP.imageExportGrayscalePalette(2);
  if (exportOptions.colorDepth === "gray8")
    return TPP.imageExportGrayscalePalette(256 - reserve);
  if (exportOptions.colorDepth === "indexed")
    return TPP.imageExportNamedPalette(exportOptions.palette).slice(
      0,
      Math.max(1, 256 - reserve),
    );
  return lib.quantize(rgba, Math.max(2, 256 - reserve));
};
TPP.gifFrameFromRgba = function (
  rgba,
  width,
  height,
  exportOptions,
  lib,
  previousRgba,
) {
  const transparent = Boolean(previousRgba);
  const basePalette = TPP.gifPaletteForExport(
    rgba,
    exportOptions,
    lib,
    transparent,
  );
  const baseIndex = lib.applyPalette(rgba, basePalette);
  if (!transparent) {
    return {
      index: baseIndex,
      palette: basePalette,
      transparent: false,
      dispose: 0,
    };
  }
  const index = new Uint8Array(baseIndex.length);
  let changed = 0;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    const same =
      rgba[i] === previousRgba[i] &&
      rgba[i + 1] === previousRgba[i + 1] &&
      rgba[i + 2] === previousRgba[i + 2] &&
      rgba[i + 3] === previousRgba[i + 3];
    if (same) {
      index[p] = 0;
    } else {
      index[p] = baseIndex[p] + 1;
      changed += 1;
    }
  }
  if (!changed) index[0] = 1;
  return {
    index: index,
    palette: [[0, 0, 0]].concat(basePalette),
    transparent: true,
    transparentIndex: 0,
    dispose: 1,
  };
};
TPP.exportCanvasForDepth = function (
  canvas,
  colorDepth,
  threshold,
  paletteName,
) {
  if (!canvas || colorDepth === "color24") return canvas;
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  const data = image.data;
  const monoThreshold = Math.max(0, Math.min(255, Number(threshold) || 128));
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114,
    );
    if (colorDepth === "mono1") {
      const bit = gray >= monoThreshold ? 255 : 0;
      data[i] = bit;
      data[i + 1] = bit;
      data[i + 2] = bit;
    } else if (colorDepth === "gray8") {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }
  if (colorDepth === "indexed")
    TPP.applyIndexedPalette(data, TPP.imageExportNamedPalette(paletteName));
  ctx.putImageData(image, 0, 0);
  return out;
};
TPP.renderImageExportPreviewCanvas = async function (page, settings, scale) {
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const shell = document.createElement("div");
    shell.style.position = "relative";
    shell.style.width = settings.page.w + "in";
    shell.style.height = settings.page.h + "in";
    shell.style.background = "#fff";
    shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    mount.appendChild(shell);
    TPP.renderQr(shell, settings);
    await TPP.waitForImages(shell);
    await new Promise(requestAnimationFrame);
    return await html2canvas(
      shell,
      TPP.html2canvasOptions({ scale: Math.max(1, Number(scale) || 1) }),
    );
  } finally {
    mount.remove();
  }
};
TPP.createExportRenderShell = function (settings) {
  const shell = document.createElement("div");
  shell.style.position = "relative";
  shell.style.width = settings.page.w + "in";
  shell.style.height = settings.page.h + "in";
  shell.style.background = "#fff";
  return shell;
};
TPP.renderExportPageCanvas = async function (
  shell,
  page,
  settings,
  scale,
) {
  if (!shell) throw new Error("Render shell required");
  shell.replaceChildren(TPP.pageEl(page, settings, 0, 0, false, true));
  TPP.renderQr(shell, settings);
  await TPP.waitForImages(shell);
  await new Promise(requestAnimationFrame);
  return await html2canvas(shell, TPP.html2canvasOptions({ scale: scale }));
};
TPP.previewDataUrl = function (canvas, format, quality) {
  const mime =
    format === "jpeg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png";
  return canvas.toDataURL(
    mime,
    format === "png" ? undefined : Math.max(0.01, Math.min(1, quality || 0.92)),
  );
};
TPP.gifEncoderLib = null;
TPP.gifEncoderPromise = null;
TPP.mediabunnyLib = null;
TPP.mediabunnyPromise = null;
TPP.GIFENC_VERSION = "1.0.3";
TPP.MEDIABUNNY_VERSION = "1.46.0";
TPP.loadGifEncoder = function () {
  if (TPP.gifEncoderLib) return Promise.resolve(TPP.gifEncoderLib);
  if (!TPP.gifEncoderPromise) {
    TPP.gifEncoderPromise = import(
      "https://unpkg.com/gifenc@" + TPP.GIFENC_VERSION + "?module"
    )
      .then(function (lib) {
        TPP.gifEncoderLib = lib;
        return lib;
      })
      .catch(function (error) {
        TPP.gifEncoderPromise = null;
        throw error;
      });
  }
  return TPP.gifEncoderPromise;
};
TPP.loadMediabunny = function () {
  if (TPP.mediabunnyLib) return Promise.resolve(TPP.mediabunnyLib);
  if (!TPP.mediabunnyPromise) {
    TPP.mediabunnyPromise = import(
      "https://unpkg.com/mediabunny@" +
        TPP.MEDIABUNNY_VERSION +
        "/dist/bundles/mediabunny.mjs"
    )
      .then(function (lib) {
        TPP.mediabunnyLib = lib;
        return lib;
      })
      .catch(function (error) {
        TPP.mediabunnyPromise = null;
        throw error;
      });
  }
  return TPP.mediabunnyPromise;
};
TPP.supportedMp4Codec = async function (width, height, bitrate) {
  if (typeof window.VideoEncoder !== "function") return null;
  const lib = await TPP.loadMediabunny();
  if (!lib || typeof lib.getFirstEncodableVideoCodec !== "function") return null;
  try {
    return await lib.getFirstEncodableVideoCodec(["avc"], {
      width: width,
      height: height,
      bitrate: bitrate,
    });
  } catch (_error) {
    return null;
  }
};
TPP.mp4Bitrate = function (width, height, quality) {
  const pixels =
    Math.max(1, Number(width) || 1) * Math.max(1, Number(height) || 1);
  const q = Math.max(1, Math.min(100, Number(quality) || 92)) / 100;
  return Math.round(Math.max(600000, pixels * 1.2 * (0.45 + q * 1.55)));
};
TPP.opaqueCanvas = function (canvas, background) {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = background || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
};
TPP.mp4MetadataDate = function (value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = /^\d{4}$/.test(raw) ? raw + "-01-01" : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};
TPP.mp4MetadataComment = function (book) {
  const source = book || {};
  const publisher = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "publisher")
      : source.publisher || "",
  ).trim();
  const classification = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "classification")
      : source.classification || "",
  ).trim();
  const keywords = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "keywords")
      : source.keywords || "",
  ).trim();
  const copyright = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "copyright")
      : source.copyright || "",
  ).trim();
  const parts = [
    publisher ? "Publisher: " + publisher : "",
    classification ? "Classification: " + classification : "",
    keywords ? "Keywords: " + keywords : "",
    copyright ? "Rights: " + copyright : "",
  ].filter(Boolean);
  return parts.join(" | ");
};
TPP.mp4MetadataTags = function (book) {
  const source = book || {};
  const baseTitle = String(source.title || "Untitled").trim() || "Untitled";
  const subtitle = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subtitle")
      : source.subtitle || "",
  ).trim();
  const author = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "author")
      : source.author || "",
  ).trim();
  const description = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "description")
      : source.description || "",
  ).trim();
  const subject = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "subject")
      : source.subject || "",
  ).trim();
  const pubDate = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "pubDate")
      : source.pubDate || "",
  ).trim();
  const tags = {};
  const title = subtitle ? baseTitle + ": " + subtitle : baseTitle;
  const date = TPP.mp4MetadataDate(pubDate);
  const comment = TPP.mp4MetadataComment(source);
  if (title) tags.title = title;
  if (author) tags.artist = author;
  if (description) tags.description = description;
  if (subject) tags.genre = subject;
  if (date) tags.date = date;
  if (comment) tags.comment = comment;
  return tags;
};
TPP.encodeGifBlob = async function (canvas, options) {
  if (!canvas) throw new Error("Canvas required");
  const lib = await TPP.loadGifEncoder();
  const exportOptions = TPP.imageExportOptions(options);
  const rgba = TPP.canvasRgba(canvas);
  const frame = TPP.gifFrameFromRgba(
    rgba,
    canvas.width,
    canvas.height,
    exportOptions,
    lib,
    null,
  );
  const gif = lib.GIFEncoder();
  gif.writeFrame(frame.index, canvas.width, canvas.height, {
    palette: frame.palette,
    delay: exportOptions.frameDelay,
  });
  gif.finish();
  const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
  return new Blob([bytes], { type: "image/gif" });
};
TPP.exportBlobForCanvas = function (canvas, options) {
  if (!canvas) return Promise.resolve(null);
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.format === "gif")
    return TPP.encodeGifBlob(canvas, exportOptions);
  const mime =
    exportOptions.format === "jpeg"
      ? "image/jpeg"
      : exportOptions.format === "webp"
        ? "image/webp"
        : "image/png";
  return new Promise(function (resolve) {
    canvas.toBlob(
      function (blob) {
        resolve(blob || null);
      },
      mime,
      exportOptions.format === "png"
        ? undefined
        : Math.max(0.01, Math.min(1, exportOptions.quality / 100 || 0.92)),
    );
  });
};
TPP.previewBlobSize = function (canvas, format, quality) {
  return TPP.exportBlobForCanvas(canvas, {
    format: format,
    quality: quality,
  }).then(function (blob) {
    return blob ? blob.size : 0;
  });
};
TPP.exportImagesZip = async function (options) {
  await TPP.ensureImageExportPaletteForOptionsLoaded(options);
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!window.JSZip) {
    alert("ZIP export library failed to load.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(options);
  const zip = new JSZip();
  const mount = document.createElement("div");
  const targetDpi = exportOptions.dpi;
  const scale = targetDpi / 96;
  const extension =
    exportOptions.format === "jpeg" ? "jpg" : exportOptions.format;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering page image " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: scale }),
      );
      const exportCanvas = TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
      );
      const blob = await TPP.exportBlobForCanvas(exportCanvas, exportOptions);
      const pageName =
        "page-" + String(i + 1).padStart(4, "0") + "." + extension;
      zip.file(pageName, blob);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    TPP.showProgress(90, "Building ZIP archive...");
    const blob = await zip.generateAsync({ type: "blob" }, function (meta) {
      TPP.showProgress(
        90 + Math.round(meta.percent * 0.1),
        "Building ZIP archive...",
      );
    });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") +
      "-pages-" +
      targetDpi +
      "dpi-" +
      exportOptions.format +
      ".zip";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "Page images ZIP complete");
};
TPP.exportAnimatedGif = async function (options) {
  await TPP.ensureImageExportPaletteForOptionsLoaded(
    Object.assign({}, options || {}, { format: "gif" }),
  );
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!pages.length) {
    alert("No pages available to export.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(
    Object.assign({}, options || {}, { format: "gif" }),
  );
  const lib = await TPP.loadGifEncoder();
  const gif = lib.GIFEncoder();
  const mount = document.createElement("div");
  const scale = exportOptions.dpi / 96;
  let previousRgba = null;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering GIF frame " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: scale }),
      );
      const exportCanvas = TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
      );
      const rgba = TPP.canvasRgba(exportCanvas);
      const frame = TPP.gifFrameFromRgba(
        rgba,
        exportCanvas.width,
        exportCanvas.height,
        exportOptions,
        lib,
        previousRgba,
      );
      gif.writeFrame(frame.index, exportCanvas.width, exportCanvas.height, {
        palette: frame.palette,
        delay: exportOptions.frameDelay,
        repeat: i === 0 ? 0 : undefined,
        transparent: frame.transparent || undefined,
        transparentIndex: frame.transparent
          ? frame.transparentIndex
          : undefined,
        dispose: frame.transparent ? frame.dispose : undefined,
      });
      previousRgba = new Uint8ClampedArray(rgba);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    gif.finish();
    const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
    const blob = new Blob([bytes], { type: "image/gif" });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") + "-pages-animated.gif";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "Animated GIF complete");
};
TPP.exportMp4 = async function (options) {
  await TPP.ensureImageExportPaletteForOptionsLoaded(options);
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!pages.length) {
    alert("No pages available to export.");
    return;
  }
  if (typeof window.VideoEncoder !== "function") {
    alert("MP4 export is not supported in this browser.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(options);
  const mediabunny = await TPP.loadMediabunny();
  const mount = document.createElement("div");
  const scale = exportOptions.dpi / 96;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const renderShell = TPP.createExportRenderShell(settings);
    mount.appendChild(renderShell);
    const probeCanvas = await TPP.renderExportPageCanvas(
      renderShell,
      pages[0],
      settings,
      scale,
    );
    const firstCanvas = TPP.exportCanvasForDepth(
      probeCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
    );
    const firstOpaqueCanvas = TPP.opaqueCanvas(firstCanvas, "#ffffff");
    const width = firstOpaqueCanvas.width;
    const height = firstOpaqueCanvas.height;
    const bitrate = TPP.mp4Bitrate(width, height, exportOptions.quality);
    const codec = await TPP.supportedMp4Codec(width, height, bitrate);
    if (!codec) {
      throw new Error("No supported MP4 codec found in this browser.");
    }
    const fps = Math.max(1, Math.round(1000 / Math.max(1, exportOptions.frameDelay)));
    const target = new mediabunny.BufferTarget();
    const output = new mediabunny.Output({
      format: new mediabunny.Mp4OutputFormat(),
      target: target,
    });
    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = width;
    videoCanvas.height = height;
    const videoCtx = videoCanvas.getContext("2d");
    if (!videoCtx) throw new Error("Unable to create MP4 export canvas.");
    const videoSource = new mediabunny.VideoSampleSource({
      codec: codec,
      bitrate: bitrate,
      keyFrameInterval: 2,
      transform: {
        frameRate: fps,
        alpha: "discard",
      },
    });
    output.addVideoTrack(videoSource, {
      frameRate: fps,
      maximumPacketCount: pages.length,
      hasOnlyKeyPackets: false,
    });
    const metadataTags = TPP.mp4MetadataTags(settings);
    if (Object.keys(metadataTags).length) output.setMetadataTags(metadataTags);
    await output.start();
    let timestamp = 0;
    const duration = Math.max(0.01, exportOptions.frameDelay / 1000);
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering MP4 frame " + (i + 1) + " of " + pages.length + "...",
      );
      const pageCanvas =
        i === 0
          ? firstOpaqueCanvas
          : await (async function () {
              const canvas = await TPP.renderExportPageCanvas(
                renderShell,
                pages[i],
                settings,
                scale,
              );
              return TPP.opaqueCanvas(
                TPP.exportCanvasForDepth(
                  canvas,
                  exportOptions.colorDepth,
                  exportOptions.threshold,
                  exportOptions.palette,
                ),
                "#ffffff",
              );
            })();
      videoCtx.clearRect(0, 0, width, height);
      videoCtx.drawImage(pageCanvas, 0, 0, width, height);
      const sample = new mediabunny.VideoSample(videoCanvas, {
        timestamp: timestamp,
        duration: duration,
      });
      try {
        await videoSource.add(sample, { keyFrame: i === 0 });
      } finally {
        sample.close();
      }
      timestamp += duration;
      await new Promise(requestAnimationFrame);
    }
    videoSource.close();
    await output.finalize();
    if (!target.buffer) {
      throw new Error("MP4 export completed without a downloadable buffer.");
    }
    const blob = new Blob([target.buffer], { type: "video/mp4" });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") + "-pages.mp4";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "MP4 complete");
};
