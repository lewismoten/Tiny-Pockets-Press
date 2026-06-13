window.TPP = window.TPP || {};

TPP.generatorInfo = function () {
  const name = "Tiny Pockets Press";
  const pdfEngineName = "jsPDF";
  const fallbackSiteUrl = "https://tinypocketspress.local";
  let siteUrl = fallbackSiteUrl;
  if (
    typeof window !== "undefined" &&
    window.location &&
    (window.location.protocol === "http:" || window.location.protocol === "https:")
  ) {
    siteUrl = window.location.origin;
  }
  let domain = "tinypocketspress.local";
  try {
    domain = new URL(siteUrl).host || domain;
  } catch (_error) {}
  return {
    name: name,
    siteUrl: siteUrl,
    domain: domain,
    namespaceUrl: siteUrl.replace(/\/+$/g, "") + "/ns/1.0/",
    exportLabel: name + " Export",
    pdfEngineName: pdfEngineName,
    pdfCreator: name,
    pdfProducer: name + " via " + pdfEngineName,
  };
};
TPP.html2canvasOptions = function (options) {
  return Object.assign(
    {
      backgroundColor: "#fff",
      logging: false,
    },
    options || {},
  );
};
TPP.exportClassificationText = function (book) {
  const source = book || {};
  const rawValue =
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "classification")
      : source.classification || "";
  if (!rawValue) return "";
  if (
    typeof TPP.classificationValueData === "function" &&
    typeof TPP.classificationDisplayString === "function"
  ) {
    try {
      return String(
        TPP.classificationDisplayString(
          source,
          TPP.classificationValueData(rawValue),
        ) || "",
      ).trim();
    } catch (_error) {}
  }
  if (typeof rawValue === "string") return rawValue.trim();
  if (rawValue && typeof rawValue === "object") {
    return String(
      rawValue.title ||
        rawValue.code ||
        rawValue.shortLabel ||
        rawValue.label ||
        "",
    ).trim();
  }
  return String(rawValue || "").trim();
};
TPP.exportMetadataFields = function (book, options) {
  const source = book || {};
  const config = options || {};
  const title = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "title")
      : source.title || "",
  ).trim();
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
  const language = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "language")
      : source.language || "",
  ).trim();
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
  const keywords = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "keywords")
      : source.keywords || "",
  ).trim();
  const classification = TPP.exportClassificationText(source);
  const copyright = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "copyright")
      : source.copyright || "",
  ).trim();
  const pageIndex = Math.max(0, Number(config.pageIndex) || 0);
  const totalPages = Math.max(0, Number(config.totalPages) || 0);
  return {
    title: title ? title + (subtitle ? ": " + subtitle : "") : "",
    author: author,
    publisher: publisher,
    date: pubDate,
    language: language,
    subject: subject,
    classification: classification,
    page:
      pageIndex > 0
        ? totalPages > 0
          ? pageIndex + " of " + totalPages
          : String(pageIndex)
        : "",
    keywords: keywords,
    description: description,
    rights: copyright,
  };
};
TPP.condensedMetadataText = function (items, options) {
  const config = options || {};
  const separator = Object.prototype.hasOwnProperty.call(config, "separator")
    ? String(config.separator)
    : "\n";
  const maxLength = Math.max(1, Number(config.maxLength) || 240);
  const measure =
    config.measure === "chars"
      ? function (value) {
          return String(value || "").length;
        }
      : function (value) {
          return new TextEncoder().encode(String(value || "")).length;
        };
  const parts = [];
  const pushPart = function (label, value) {
    const trimmedValue = String(value || "").trim();
    if (!trimmedValue) return;
    const nextPart = label + ": " + trimmedValue;
    const candidate = parts.concat(nextPart).join(separator);
    if (measure(candidate) <= maxLength) {
      parts.push(nextPart);
    }
  };
  (Array.isArray(items) ? items : []).forEach(function (item) {
    if (!item) return;
    pushPart(item.label, item.value);
  });
  if (
    !parts.length &&
    config.fallback &&
    config.fallback.label &&
    String(config.fallback.value || "").trim()
  ) {
    const fallbackPrefix = String(config.fallback.label).trim() + ": ";
    const budget = Math.max(1, maxLength - measure(fallbackPrefix));
    let fallbackValue = String(config.fallback.value || "").trim();
    while (fallbackValue && measure(fallbackValue) > budget) {
      fallbackValue = fallbackValue.slice(0, -1).trimEnd();
    }
    if (fallbackValue) {
      parts.push(fallbackPrefix + fallbackValue);
    }
  }
  return parts.join(separator);
};
TPP.gifCommentText = function (book, options) {
  const fields = TPP.exportMetadataFields(book, options);
  return TPP.condensedMetadataText(
    [
      { label: "Title", value: fields.title },
      { label: "Author", value: fields.author },
      { label: "Publisher", value: fields.publisher },
      { label: "Date", value: fields.date },
      { label: "Language", value: fields.language },
      { label: "Subject", value: fields.subject },
      { label: "Classification", value: fields.classification },
      { label: "Page", value: fields.page },
      { label: "Keywords", value: fields.keywords },
      { label: "Rights", value: fields.rights },
    ],
    {
      separator: "\n",
      maxLength: 240,
      fallback: {
        label: "Description",
        value: fields.description,
      },
    },
  );
};
TPP.writeGifCommentExtension = function (gif, text) {
  const message = String(text || "").trim();
  if (!gif || !gif.stream || !message) return;
  const stream = gif.stream;
  const bytes = new TextEncoder()
    .encode(message)
    .filter(function (value) {
      return value !== 0;
    });
  if (!bytes.length) return;
  stream.writeByte(0x21);
  stream.writeByte(0xfe);
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const size = Math.min(255, bytes.length - offset);
    stream.writeByte(size);
    stream.writeBytesView(bytes, offset, size);
  }
  stream.writeByte(0x00);
};
TPP.pngTextEncoder = new TextEncoder();
TPP.pngUint32Bytes = function (value) {
  const out = new Uint8Array(4);
  const normalized = Number(value) >>> 0;
  out[0] = (normalized >>> 24) & 0xff;
  out[1] = (normalized >>> 16) & 0xff;
  out[2] = (normalized >>> 8) & 0xff;
  out[3] = normalized & 0xff;
  return out;
};
TPP.pngCrcTable = null;
TPP.pngCrc32 = function (bytes) {
  if (!TPP.pngCrcTable) {
    TPP.pngCrcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      TPP.pngCrcTable[i] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = TPP.pngCrcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};
TPP.pngChunkBytes = function (type, data) {
  const typeBytes = TPP.pngTextEncoder.encode(String(type || "").slice(0, 4));
  const payload = data instanceof Uint8Array ? data : new Uint8Array(0);
  const chunk = new Uint8Array(12 + payload.length);
  chunk.set(TPP.pngUint32Bytes(payload.length), 0);
  chunk.set(typeBytes, 4);
  chunk.set(payload, 8);
  const crcInput = new Uint8Array(typeBytes.length + payload.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(payload, typeBytes.length);
  chunk.set(TPP.pngUint32Bytes(TPP.pngCrc32(crcInput)), 8 + payload.length);
  return chunk;
};
TPP.pngTextEntries = function (book, options) {
  const fields = TPP.exportMetadataFields(book, options);
  const generator = TPP.generatorInfo();
  return [
    {
      keyword: "Title",
      value: fields.title,
    },
    { keyword: "Author", value: fields.author },
    { keyword: "Description", value: fields.description },
    { keyword: "Subject", value: fields.subject },
    { keyword: "Publisher", value: fields.publisher },
    { keyword: "Creation Time", value: fields.date },
    { keyword: "Language", value: fields.language },
    { keyword: "Keywords", value: fields.keywords },
    { keyword: "Copyright", value: fields.rights },
    { keyword: "Software", value: generator.name },
    { keyword: "XML:com.adobe.xmp", value: TPP.pngXmpPacket(book, options) },
    { keyword: "__EXIF__", value: TPP.pngExifBytes(book, options) },
    { keyword: "__TIME__", value: TPP.pngGeneratedDateInfo(options).pngTime },
    {
      keyword: "Comment",
      value: TPP.condensedMetadataText(
        [
          { label: "Title", value: fields.title },
          { label: "Author", value: fields.author },
          { label: "Publisher", value: fields.publisher },
          { label: "Classification", value: fields.classification },
          { label: "Page", value: fields.page },
          { label: "Keywords", value: fields.keywords },
          { label: "Rights", value: fields.rights },
        ],
        {
          separator: " | ",
          maxLength: 240,
          measure: "chars",
        },
      ),
    },
  ].filter(function (entry) {
    return String(entry.value || "").trim();
  });
};
TPP.pngITXtChunk = function (keyword, value) {
  const keywordBytes = TPP.pngTextEncoder.encode(String(keyword || "").trim());
  const valueBytes = TPP.pngTextEncoder.encode(String(value || "").trim());
  const payload = new Uint8Array(
    keywordBytes.length + 1 + 1 + 1 + 1 + 1 + valueBytes.length,
  );
  let offset = 0;
  payload.set(keywordBytes, offset);
  offset += keywordBytes.length;
  payload[offset++] = 0x00;
  payload[offset++] = 0x00;
  payload[offset++] = 0x00;
  payload[offset++] = 0x00;
  payload[offset++] = 0x00;
  payload.set(valueBytes, offset);
  return TPP.pngChunkBytes("iTXt", payload);
};
TPP.pngTTextLatin1 = function (value) {
  return TPP.legacyMetadataText(value)
    .replace(/[^\x00-\xff]/g, "?")
    .trim();
};
TPP.pngLatin1Bytes = function (value) {
  const text = TPP.pngTTextLatin1(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
};
TPP.pngTTextChunk = function (keyword, value) {
  const keywordBytes = TPP.pngTextEncoder.encode(String(keyword || "").trim());
  const valueBytes = TPP.pngLatin1Bytes(value);
  const payload = new Uint8Array(keywordBytes.length + 1 + valueBytes.length);
  let offset = 0;
  payload.set(keywordBytes, offset);
  offset += keywordBytes.length;
  payload[offset++] = 0x00;
  payload.set(valueBytes, offset);
  return TPP.pngChunkBytes("tEXt", payload);
};
TPP.pngXmlEscape = function (value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};
TPP.legacyMetadataText = function (value) {
  return String(value || "")
    .replace(/\u00a9/g, "(C)")
    .replace(/\u2122/g, "(TM)")
    .replace(/\u00ae/g, "(R)")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...");
};
TPP.pngXmpDateTime = function (value) {
  const xmpOffset = function (date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Z";
    const minutesEast = -date.getTimezoneOffset();
    if (!Number.isFinite(minutesEast)) return "Z";
    const sign = minutesEast >= 0 ? "+" : "-";
    const absolute = Math.abs(minutesEast);
    const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
    const minutes = String(absolute % 60).padStart(2, "0");
    return sign + hours + ":" + minutes;
  };
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(raw))
    return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(raw + "T00:00:00");
    return raw + "T00:00:00" + xmpOffset(date);
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const valueWithDay = raw + "-01";
    const date = new Date(valueWithDay + "T00:00:00");
    return valueWithDay + "T00:00:00" + xmpOffset(date);
  }
  if (/^\d{4}$/.test(raw)) {
    const valueWithMonthDay = raw + "-01-01";
    const date = new Date(valueWithMonthDay + "T00:00:00");
    return valueWithMonthDay + "T00:00:00" + xmpOffset(date);
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return (
    year +
    "-" +
    month +
    "-" +
    day +
    "T" +
    hour +
    ":" +
    minute +
    ":" +
    second +
    xmpOffset(date)
  );
};
TPP.pngGeneratedDateInfo = function (options) {
  const config = options || {};
  const source =
    config.generatedAt instanceof Date
      ? new Date(config.generatedAt.getTime())
      : config.generatedAt
        ? new Date(config.generatedAt)
        : new Date();
  const date = Number.isNaN(source.getTime()) ? new Date() : source;
  const pad = function (value) {
    return String(value).padStart(2, "0");
  };
  const offsetMinutesEast = -date.getTimezoneOffset();
  const offset =
    Number.isFinite(offsetMinutesEast)
      ? (function () {
          const sign = offsetMinutesEast >= 0 ? "+" : "-";
          const absolute = Math.abs(offsetMinutesEast);
          const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
          const minutes = String(absolute % 60).padStart(2, "0");
          return sign + hours + ":" + minutes;
        })()
      : "Z";
  return {
    xmp:
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds()) +
      offset,
    exif:
      date.getFullYear() +
      ":" +
      pad(date.getMonth() + 1) +
      ":" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds()),
    pngTime: new Uint8Array([
      (date.getUTCFullYear() >>> 8) & 0xff,
      date.getUTCFullYear() & 0xff,
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    ]),
  };
};
TPP.pngXmpPacket = function (book, options) {
  const fields = TPP.exportMetadataFields(book, options);
  const generator = TPP.generatorInfo();
  const languageTag = String(fields.language || "").trim();
  const altLanguage = languageTag || "x-default";
  const xmpDate = TPP.pngXmpDateTime(fields.date);
  const generated = TPP.pngGeneratedDateInfo(options);
  const keywords = String(fields.keywords || "")
    .split(/[,;\n]+/)
    .map(function (item) {
      return String(item || "").trim();
    })
    .filter(Boolean);
  const subjects = Array.from(
    new Set([fields.subject, fields.classification].concat(keywords).filter(Boolean)),
  );
  const lines = [
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    '    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:tpp="' +
      TPP.pngXmlEscape(generator.namespaceUrl) +
      '">',
  ];
  if (fields.title) {
    lines.push(
      "      <dc:title><rdf:Alt>" +
        "<rdf:li xml:lang=\"x-default\">" +
        TPP.pngXmlEscape(fields.title) +
        "</rdf:li>" +
        (altLanguage !== "x-default"
          ? "<rdf:li xml:lang=\"" +
            TPP.pngXmlEscape(altLanguage) +
            "\">" +
            TPP.pngXmlEscape(fields.title) +
            "</rdf:li>"
          : "") +
        "</rdf:Alt></dc:title>",
    );
  }
  if (fields.author) {
    lines.push(
      "      <dc:creator><rdf:Seq><rdf:li>" +
        TPP.pngXmlEscape(fields.author) +
        "</rdf:li></rdf:Seq></dc:creator>",
    );
  }
  if (fields.description) {
    lines.push(
      "      <dc:description><rdf:Alt>" +
        "<rdf:li xml:lang=\"x-default\">" +
        TPP.pngXmlEscape(fields.description) +
        "</rdf:li>" +
        (altLanguage !== "x-default"
          ? "<rdf:li xml:lang=\"" +
            TPP.pngXmlEscape(altLanguage) +
            "\">" +
            TPP.pngXmlEscape(fields.description) +
            "</rdf:li>"
          : "") +
        "</rdf:Alt></dc:description>",
    );
  }
  if (subjects.length) {
    lines.push("      <dc:subject><rdf:Bag>");
    subjects.forEach(function (subject) {
      lines.push("        <rdf:li>" + TPP.pngXmlEscape(subject) + "</rdf:li>");
    });
    lines.push("      </rdf:Bag></dc:subject>");
  }
  if (fields.publisher) {
    lines.push(
      "      <dc:publisher><rdf:Seq><rdf:li>" +
        TPP.pngXmlEscape(fields.publisher) +
        "</rdf:li></rdf:Seq></dc:publisher>",
    );
  }
  if (fields.rights) {
    lines.push(
      "      <dc:rights><rdf:Alt>" +
        "<rdf:li xml:lang=\"x-default\">" +
        TPP.pngXmlEscape(fields.rights) +
        "</rdf:li>" +
        (altLanguage !== "x-default"
          ? "<rdf:li xml:lang=\"" +
            TPP.pngXmlEscape(altLanguage) +
            "\">" +
            TPP.pngXmlEscape(fields.rights) +
            "</rdf:li>"
          : "") +
        "</rdf:Alt></dc:rights>",
    );
  }
  if (xmpDate) {
    lines.push("      <xmp:CreateDate>" + TPP.pngXmlEscape(xmpDate) + "</xmp:CreateDate>");
  }
  lines.push("      <xmp:ModifyDate>" + TPP.pngXmlEscape(generated.xmp) + "</xmp:ModifyDate>");
  lines.push("      <xmp:MetadataDate>" + TPP.pngXmlEscape(generated.xmp) + "</xmp:MetadataDate>");
  lines.push(
    "      <xmp:CreatorTool>" +
      TPP.pngXmlEscape(generator.name) +
      "</xmp:CreatorTool>",
  );
  if (fields.language) {
    lines.push("      <dc:language><rdf:Bag><rdf:li>" + TPP.pngXmlEscape(fields.language) + "</rdf:li></rdf:Bag></dc:language>");
  }
  if (fields.classification) {
    lines.push("      <tpp:classification>" + TPP.pngXmlEscape(fields.classification) + "</tpp:classification>");
  }
  if (fields.page) {
    lines.push("      <tpp:page>" + TPP.pngXmlEscape(fields.page) + "</tpp:page>");
  }
  lines.push("    </rdf:Description>");
  lines.push("  </rdf:RDF>");
  lines.push("</x:xmpmeta>");
  lines.push('<?xpacket end="w"?>');
  return lines.join("\n");
};
TPP.pngExifDateTime = function (value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}:\d{2}:\d{2}( \d{2}:\d{2}:\d{2})?$/.test(raw)) {
    return raw.length === 10 ? raw + " 00:00:00" : raw;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw.replace(/-/g, ":") + " 00:00:00";
  }
  if (/^\d{4}-\d{2}$/.test(raw)) {
    return raw.replace(/-/g, ":") + ":01 00:00:00";
  }
  if (/^\d{4}$/.test(raw)) {
    return raw + ":01:01 00:00:00";
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return year + ":" + month + ":" + day + " " + hour + ":" + minute + ":" + second;
};
TPP.pngExifAscii = function (value) {
  return TPP.legacyMetadataText(value).replace(/\0/g, "").trim();
};
TPP.pngExifUserComment = function (value) {
  const text = TPP.legacyMetadataText(value).trim();
  if (!text) return new Uint8Array(0);
  const prefix = new Uint8Array([0x41, 0x53, 0x43, 0x49, 0x49, 0x00, 0x00, 0x00]);
  const body = TPP.pngLatin1Bytes(text);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix, 0);
  out.set(body, prefix.length);
  return out;
};
TPP.pngExifBytes = function (book, options) {
  const fields = TPP.exportMetadataFields(book, options);
  const generator = TPP.generatorInfo();
  const exifDate = TPP.pngExifDateTime(fields.date);
  const generated = TPP.pngGeneratedDateInfo(options);
  const comment = TPP.condensedMetadataText(
    [
      { label: "Title", value: fields.title },
      { label: "Author", value: fields.author },
      { label: "Publisher", value: fields.publisher },
      { label: "Classification", value: fields.classification },
      { label: "Page", value: fields.page },
      { label: "Keywords", value: fields.keywords },
      { label: "Rights", value: fields.rights },
    ],
    { separator: " | ", maxLength: 240, measure: "chars" },
  );
  const ifd0Entries = [];
  const exifEntries = [];
  const addAscii = function (entries, tag, value) {
    const text = TPP.pngExifAscii(value);
    if (!text) return;
    entries.push({
      tag: tag,
      type: 2,
      count: text.length + 1,
      data: TPP.pngTextEncoder.encode(text + "\0"),
    });
  };
  const addBinary = function (entries, tag, data) {
    if (!(data instanceof Uint8Array) || !data.length) return;
    entries.push({ tag: tag, type: 7, count: data.length, data: data });
  };
  addAscii(ifd0Entries, 0x010e, fields.description || fields.title);
  addAscii(ifd0Entries, 0x013b, fields.author);
  addAscii(ifd0Entries, 0x0131, generator.name);
  addAscii(ifd0Entries, 0x0132, generated.exif);
  addAscii(ifd0Entries, 0x8298, fields.rights);
  addBinary(exifEntries, 0x9286, TPP.pngExifUserComment(comment));
  if (exifDate) addAscii(exifEntries, 0x9003, exifDate);
  addAscii(exifEntries, 0x9004, generated.exif);
  if (exifEntries.length) {
    ifd0Entries.push({ tag: 0x8769, type: 4, count: 1, pointerTo: "exif" });
  }
  if (!ifd0Entries.length) return new Uint8Array(0);
  const tiffHeaderSize = 8;
  const ifdSize = function (entries) {
    return 2 + entries.length * 12 + 4;
  };
  const ifd0Offset = 8;
  const exifIfdOffset = ifd0Entries.some(function (entry) { return entry.pointerTo === "exif"; })
    ? ifd0Offset + ifdSize(ifd0Entries)
    : 0;
  let dataOffset = ifd0Offset + ifdSize(ifd0Entries) + (exifEntries.length ? ifdSize(exifEntries) : 0);
  const assignOffsets = function (entries, pointerMap) {
    entries.forEach(function (entry) {
      if (entry.pointerTo) {
        entry.valueOffset = pointerMap[entry.pointerTo] || 0;
        return;
      }
      if (entry.count <= 4 && entry.type !== 2 && entry.type !== 7) {
        entry.valueOffset = null;
        return;
      }
      if (entry.data.length <= 4) {
        entry.valueOffset = null;
        return;
      }
      entry.valueOffset = dataOffset;
      dataOffset += entry.data.length;
      if (dataOffset % 2) dataOffset += 1;
    });
  };
  assignOffsets(ifd0Entries, { exif: exifIfdOffset });
  assignOffsets(exifEntries, {});
  const out = new Uint8Array(dataOffset);
  const dv = new DataView(out.buffer);
  out[0] = 0x49;
  out[1] = 0x49;
  dv.setUint16(2, 42, true);
  dv.setUint32(4, ifd0Offset, true);
  const writeIfd = function (offset, entries, nextOffset) {
    dv.setUint16(offset, entries.length, true);
    let cursor = offset + 2;
    entries.forEach(function (entry) {
      dv.setUint16(cursor, entry.tag, true);
      dv.setUint16(cursor + 2, entry.type, true);
      dv.setUint32(cursor + 4, entry.count, true);
      if (entry.valueOffset != null) {
        dv.setUint32(cursor + 8, entry.valueOffset, true);
      } else {
        const inline = new Uint8Array(4);
        if (entry.data) inline.set(entry.data.subarray(0, Math.min(4, entry.data.length)), 0);
        out.set(inline, cursor + 8);
      }
      cursor += 12;
    });
    dv.setUint32(cursor, nextOffset || 0, true);
  };
  writeIfd(ifd0Offset, ifd0Entries, 0);
  if (exifEntries.length) writeIfd(exifIfdOffset, exifEntries, 0);
  const writeData = function (entries) {
    entries.forEach(function (entry) {
      if (entry.valueOffset == null || !entry.data || entry.data.length <= 4) return;
      out.set(entry.data, entry.valueOffset);
    });
  };
  writeData(ifd0Entries);
  writeData(exifEntries);
  return out;
};
TPP.insertPngMetadata = function (bytes, entries) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return bytes;
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const textChunks = [];
  normalizedEntries.forEach(function (entry) {
    if (!entry || !String(entry.value || "").trim()) return;
    if (entry.keyword === "XML:com.adobe.xmp" || entry.keyword === "__EXIF__") return;
    textChunks.push(TPP.pngITXtChunk(entry.keyword, entry.value));
    if (["Title", "Author", "Description", "Comment", "Copyright"].includes(entry.keyword)) {
      textChunks.push(TPP.pngTTextChunk(entry.keyword, entry.value));
    }
  });
  const xmpEntry = normalizedEntries.find(function (entry) {
    return entry && entry.keyword === "XML:com.adobe.xmp";
  });
  const exifEntry = normalizedEntries.find(function (entry) {
    return entry && entry.keyword === "__EXIF__";
  });
  const timeEntry = normalizedEntries.find(function (entry) {
    return entry && entry.keyword === "__TIME__";
  });
  if (xmpEntry && String(xmpEntry.value || "").trim()) {
    textChunks.unshift(TPP.pngITXtChunk("XML:com.adobe.xmp", xmpEntry.value));
  }
  if (exifEntry && exifEntry.value instanceof Uint8Array && exifEntry.value.length) {
    textChunks.unshift(TPP.pngChunkBytes("eXIf", exifEntry.value));
  }
  if (timeEntry && timeEntry.value instanceof Uint8Array && timeEntry.value.length === 7) {
    textChunks.unshift(TPP.pngChunkBytes("tIME", timeEntry.value));
  }
  if (!textChunks.length) return bytes;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) >>> 0) +
      ((bytes[offset + 1] << 16) >>> 0) +
      ((bytes[offset + 2] << 8) >>> 0) +
      (bytes[offset + 3] >>> 0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    offset += 12 + length;
    if (type === "IHDR") break;
  }
  while (offset + 12 <= bytes.length) {
    const length =
      ((bytes[offset] << 24) >>> 0) +
      ((bytes[offset + 1] << 16) >>> 0) +
      ((bytes[offset + 2] << 8) >>> 0) +
      (bytes[offset + 3] >>> 0);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === "PLTE" || type === "IDAT") break;
    offset += 12 + length;
  }
  const insertBytesLength = textChunks.reduce(function (sum, chunk) {
    return sum + chunk.length;
  }, 0);
  const out = new Uint8Array(bytes.length + insertBytesLength);
  out.set(bytes.subarray(0, offset), 0);
  let cursor = offset;
  textChunks.forEach(function (chunk) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  });
  out.set(bytes.subarray(offset), cursor);
  return out;
};
TPP.jpegCommentText = function (book, options) {
  const fields = TPP.exportMetadataFields(book, options);
  return TPP.condensedMetadataText(
    [
      { label: "Title", value: fields.title },
      { label: "Author", value: fields.author },
      { label: "Publisher", value: fields.publisher },
      { label: "Classification", value: fields.classification },
      { label: "Page", value: fields.page },
      { label: "Keywords", value: fields.keywords },
      { label: "Rights", value: fields.rights },
    ],
    {
      separator: " | ",
      maxLength: 240,
      measure: "chars",
      fallback: {
        label: "Description",
        value: fields.description,
      },
    },
  );
};
TPP.jpegSegmentBytes = function (marker, payload) {
  const data = payload instanceof Uint8Array ? payload : new Uint8Array(0);
  const length = data.length + 2;
  const out = new Uint8Array(data.length + 4);
  out[0] = 0xff;
  out[1] = marker & 0xff;
  out[2] = (length >>> 8) & 0xff;
  out[3] = length & 0xff;
  out.set(data, 4);
  return out;
};
TPP.jpegApp1ExifSegment = function (book, options) {
  const exifBytes = TPP.pngExifBytes(book, options);
  if (!(exifBytes instanceof Uint8Array) || !exifBytes.length) return new Uint8Array(0);
  const prefix = TPP.pngTextEncoder.encode("Exif\0\0");
  const payload = new Uint8Array(prefix.length + exifBytes.length);
  payload.set(prefix, 0);
  payload.set(exifBytes, prefix.length);
  return TPP.jpegSegmentBytes(0xe1, payload);
};
TPP.jpegApp1XmpSegment = function (book, options) {
  const packet = TPP.pngXmpPacket(book, options);
  if (!String(packet || "").trim()) return new Uint8Array(0);
  const prefix = TPP.pngTextEncoder.encode("http://ns.adobe.com/xap/1.0/\0");
  const body = TPP.pngTextEncoder.encode(packet);
  const payload = new Uint8Array(prefix.length + body.length);
  payload.set(prefix, 0);
  payload.set(body, prefix.length);
  return TPP.jpegSegmentBytes(0xe1, payload);
};
TPP.jpegCommentSegment = function (book, options) {
  const comment = TPP.legacyMetadataText(TPP.jpegCommentText(book, options));
  if (!comment) return new Uint8Array(0);
  return TPP.jpegSegmentBytes(0xfe, TPP.pngLatin1Bytes(comment));
};
TPP.insertJpegMetadata = function (bytes, book, options) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 4) return bytes;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const segments = [
    TPP.jpegApp1ExifSegment(book, options),
    TPP.jpegApp1XmpSegment(book, options),
    TPP.jpegCommentSegment(book, options),
  ].filter(function (segment) {
    return segment && segment.length;
  });
  if (!segments.length) return bytes;
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (
      !(
        (marker >= 0xe0 && marker <= 0xef) ||
        marker === 0xfe
      )
    ) {
      break;
    }
    const length = ((bytes[offset + 2] << 8) >>> 0) + (bytes[offset + 3] >>> 0);
    if (length < 2 || offset + 2 + length > bytes.length) break;
    offset += 2 + length;
  }
  const insertBytesLength = segments.reduce(function (sum, segment) {
    return sum + segment.length;
  }, 0);
  const out = new Uint8Array(bytes.length + insertBytesLength);
  out.set(bytes.subarray(0, offset), 0);
  let cursor = offset;
  segments.forEach(function (segment) {
    out.set(segment, cursor);
    cursor += segment.length;
  });
  out.set(bytes.subarray(offset), cursor);
  return out;
};
TPP.webpUint32Bytes = function (value) {
  const out = new Uint8Array(4);
  const normalized = Number(value) >>> 0;
  out[0] = normalized & 0xff;
  out[1] = (normalized >>> 8) & 0xff;
  out[2] = (normalized >>> 16) & 0xff;
  out[3] = (normalized >>> 24) & 0xff;
  return out;
};
TPP.webpUint24Bytes = function (value) {
  const normalized = Math.max(0, Number(value) || 0);
  return new Uint8Array([
    normalized & 0xff,
    (normalized >>> 8) & 0xff,
    (normalized >>> 16) & 0xff,
  ]);
};
TPP.webpChunkBytes = function (type, data) {
  const typeBytes = TPP.pngTextEncoder.encode(String(type || "").slice(0, 4));
  const payload = data instanceof Uint8Array ? data : new Uint8Array(0);
  const out = new Uint8Array(8 + payload.length + (payload.length % 2));
  out.set(typeBytes, 0);
  out.set(TPP.webpUint32Bytes(payload.length), 4);
  out.set(payload, 8);
  return out;
};
TPP.webpChunks = function (bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 12) return [];
  if (
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "RIFF" ||
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== "WEBP"
  ) {
    return [];
  }
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const length =
      (bytes[offset + 4] >>> 0) +
      ((bytes[offset + 5] << 8) >>> 0) +
      ((bytes[offset + 6] << 16) >>> 0) +
      ((bytes[offset + 7] << 24) >>> 0);
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + length;
    if (payloadEnd > bytes.length) break;
    chunks.push({
      type: type,
      start: offset,
      end: payloadEnd + (length % 2),
      payload: bytes.subarray(payloadStart, payloadEnd),
    });
    offset = payloadEnd + (length % 2);
  }
  return chunks;
};
TPP.canvasHasTransparency = function (canvas) {
  if (!canvas || !canvas.width || !canvas.height) return false;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || typeof ctx.getImageData !== "function") return false;
  try {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = image && image.data ? image.data : null;
    if (!data) return false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) return true;
    }
  } catch (_error) {
    return false;
  }
  return false;
};
TPP.webpVp8xChunk = function (width, height, flags) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const payload = new Uint8Array(10);
  payload[0] = flags & 0x3e;
  payload.set(TPP.webpUint24Bytes(safeWidth - 1), 4);
  payload.set(TPP.webpUint24Bytes(safeHeight - 1), 7);
  return TPP.webpChunkBytes("VP8X", payload);
};
TPP.insertWebpMetadata = function (bytes, book, options) {
  const chunks = TPP.webpChunks(bytes);
  if (!chunks.length) return bytes;
  const config = options || {};
  const exifBytes = TPP.pngExifBytes(book, options);
  const xmpPacket = TPP.pngXmpPacket(book, options);
  const xmpBytes = String(xmpPacket || "").trim()
    ? TPP.pngTextEncoder.encode(xmpPacket)
    : new Uint8Array(0);
  const exifChunk =
    exifBytes instanceof Uint8Array && exifBytes.length
      ? TPP.webpChunkBytes("EXIF", exifBytes)
      : new Uint8Array(0);
  const xmpChunk = xmpBytes.length ? TPP.webpChunkBytes("XMP ", xmpBytes) : new Uint8Array(0);
  if (!exifChunk.length && !xmpChunk.length) return bytes;
  let flags = 0;
  const bodyChunks = [];
  chunks.forEach(function (chunk) {
    if (!chunk || !chunk.type) return;
    if (chunk.type === "VP8X" && chunk.payload.length) {
      flags |= chunk.payload[0] & 0x3e;
      return;
    }
    if (chunk.type === "EXIF" || chunk.type === "XMP ") return;
    if (chunk.type === "ICCP") flags |= 0x20;
    if (chunk.type === "ALPH") flags |= 0x10;
    if (chunk.type === "ANIM" || chunk.type === "ANMF") flags |= 0x02;
    bodyChunks.push(bytes.subarray(chunk.start, chunk.end));
  });
  if (config.hasAlpha || TPP.canvasHasTransparency(config.canvas)) flags |= 0x10;
  if (exifChunk.length) flags |= 0x08;
  if (xmpChunk.length) flags |= 0x04;
  const outputChunks = [TPP.webpVp8xChunk(config.width, config.height, flags)]
    .concat(bodyChunks)
    .concat(exifChunk.length ? [exifChunk] : [])
    .concat(xmpChunk.length ? [xmpChunk] : []);
  const riffSize =
    4 +
    outputChunks.reduce(function (sum, chunk) {
      return sum + chunk.length;
    }, 0);
  const out = new Uint8Array(8 + riffSize);
  out.set(TPP.pngTextEncoder.encode("RIFF"), 0);
  out.set(TPP.webpUint32Bytes(riffSize), 4);
  out.set(TPP.pngTextEncoder.encode("WEBP"), 8);
  let offset = 12;
  outputChunks.forEach(function (chunk) {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
};
TPP.gifCommentExtensionBytes = function (text) {
  const message = String(text || "").trim();
  if (!message) return new Uint8Array(0);
  const payload = new TextEncoder()
    .encode(message)
    .filter(function (value) {
      return value !== 0;
    });
  if (!payload.length) return new Uint8Array(0);
  const parts = [0x21, 0xfe];
  for (let offset = 0; offset < payload.length; offset += 255) {
    const size = Math.min(255, payload.length - offset);
    parts.push(size);
    for (let i = 0; i < size; i++) {
      parts.push(payload[offset + i]);
    }
  }
  parts.push(0x00);
  return new Uint8Array(parts);
};
TPP.insertGifCommentBeforeImage = function (bytes, text) {
  if (!(bytes instanceof Uint8Array) || !bytes.length) return bytes;
  const commentBytes = TPP.gifCommentExtensionBytes(text);
  if (!commentBytes.length) return bytes;
  if (bytes.length < 13) return bytes;
  let offset = 13;
  const packed = bytes[10] || 0;
  if (packed & 0x80) {
    offset += 3 * (1 << ((packed & 0x07) + 1));
  }
  const skipSubBlocks = function (index) {
    let cursor = index;
    while (cursor < bytes.length) {
      const size = bytes[cursor];
      cursor += 1;
      if (size === 0) break;
      cursor += size;
    }
    return cursor;
  };
  while (offset < bytes.length) {
    const marker = bytes[offset];
    if (marker === 0x21) {
      const label = bytes[offset + 1];
      if (label === 0xf9) break;
      if (label === 0xff || label === 0x01) {
        const blockSize = bytes[offset + 2] || 0;
        offset += 3 + blockSize;
        offset = skipSubBlocks(offset);
        continue;
      }
      if (label === 0xfe) {
        offset += 2;
        offset = skipSubBlocks(offset);
        continue;
      }
    }
    if (marker === 0x2c || marker === 0x3b) break;
    offset += 1;
  }
  const out = new Uint8Array(bytes.length + commentBytes.length);
  out.set(bytes.subarray(0, offset), 0);
  out.set(commentBytes, offset);
  out.set(bytes.subarray(offset), offset + commentBytes.length);
  return out;
};
TPP.zipCommentText = function (book) {
  const fields = TPP.exportMetadataFields(book);
  return TPP.condensedMetadataText(
    [
      { label: "Title", value: fields.title },
      { label: "Author", value: fields.author },
      { label: "Publisher", value: fields.publisher },
      { label: "Date", value: fields.date },
      { label: "Classification", value: fields.classification },
      { label: "Rights", value: fields.rights },
    ],
    {
      separator: " | ",
      maxLength: 240,
      measure: "chars",
    },
  );
};
TPP.exportFilenameExtension = function (format) {
  const value = String(format || "").trim().toLowerCase();
  if (value === "jpeg") return "jpg";
  return value || "bin";
};
TPP.exportFilenameSlug = function (value, fallback) {
  const ascii = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || String(fallback || "untitled");
};
TPP.exportFilenameSegment = function (value, fallback, maxLength) {
  const slug = TPP.exportFilenameSlug(value, fallback);
  const limit = Math.max(8, Number(maxLength) || 32);
  if (slug.length <= limit) return slug;
  return slug.slice(0, limit).replace(/-+$/g, "") || String(fallback || "item");
};
TPP.exportFilenameDate = function (book) {
  const source = book || {};
  const raw = String(
    typeof TPP.bookInfoFieldValue === "function"
      ? TPP.bookInfoFieldValue(source, "pubDate")
      : source.pubDate || "",
  ).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};
TPP.exportBookStem = function (book, options) {
  const source = book || {};
  const config = options || {};
  const maxSegments = Math.max(1, Number(config.maxSegments) || 2);
  const includeDate = config.includeDate !== false;
  const includeAuthor = Boolean(config.includeAuthor);
  const includeClassification = Boolean(config.includeClassification);
  const title = String(
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "title")
      : source.title || "",
  ).trim();
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
  const classification = TPP.exportClassificationText(source);
  const segments = [];
  const pushSegment = function (value, fallback, maxLength) {
    if (!value && !fallback) return;
    segments.push(TPP.exportFilenameSegment(value, fallback, maxLength));
  };
  if (includeDate) pushSegment(TPP.exportFilenameDate(source), "", 10);
  pushSegment(title + (subtitle ? " " + subtitle : ""), "tiny-book", 52);
  if (includeAuthor) pushSegment(author, "", 24);
  if (includeClassification) pushSegment(classification, "", 18);
  return segments.filter(Boolean).slice(0, maxSegments).join("-") || "tiny-book";
};
TPP.exportFileName = function (book, options) {
  const config = options || {};
  const extension = TPP.exportFilenameExtension(config.extension || config.format);
  const stem = TPP.exportBookStem(book, config);
  const qualifiers = []
    .concat(config.kind ? [config.kind] : [])
    .concat(Array.isArray(config.qualifiers) ? config.qualifiers : [])
    .filter(Boolean)
    .map(function (part) {
      return TPP.exportFilenameSegment(part, "", 24);
    })
    .filter(Boolean);
  const name = [stem].concat(qualifiers).join("-");
  return name + "." + extension;
};
TPP.exportPageFileName = function (book, pageIndex, options) {
  const config = options || {};
  const extension = TPP.exportFilenameExtension(config.extension || config.format);
  const stem = TPP.exportBookStem(
    book,
    Object.assign({}, config, {
      maxSegments: 2,
      includeAuthor: false,
      includeClassification: false,
    }),
  );
  const totalPages = Math.max(
    1,
    Number(config.totalPages || config.pageCount || pageIndex) || 1,
  );
  const pageDigits = Math.max(1, String(Math.floor(totalPages)).length);
  const pageToken =
    "p" +
    String(Math.max(1, Number(pageIndex) || 1)).padStart(pageDigits, "0");
  const qualifiers = []
    .concat(Array.isArray(config.qualifiers) ? config.qualifiers : [])
    .filter(Boolean)
    .map(function (part) {
      return TPP.exportFilenameSegment(part, "", 20);
    })
    .filter(Boolean);
  return [stem, pageToken].concat(qualifiers).join("-") + "." + extension;
};
TPP.zipManifestMetadata = function (book, pages, options) {
  const source = book || {};
  const metadata = TPP.epubMetadata(source);
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
  const format = String((options && options.format) || "png").trim().toLowerCase();
  const pageCount = Array.isArray(pages) ? pages.length : 0;
  return {
    identifier: metadata.identifier,
    title: metadata.title,
    creator: metadata.creator,
    publisher: metadata.publisher,
    date: metadata.date,
    language: metadata.language || "en",
    description: metadata.description,
    subjects: Array.isArray(metadata.subjects) ? metadata.subjects : [],
    rights: metadata.rights,
    keywords: keywords,
    isbn13: isbn13,
    isbn: isbn,
    pageCount: pageCount,
    imageFormat: format,
    archiveComment: TPP.zipCommentText(source),
    generatedAt: metadata.modified,
    files: Array.from({ length: pageCount }, function (_unused, index) {
      return {
        name: TPP.exportPageFileName(source, index + 1, {
          format: format,
          totalPages: pageCount,
        }),
        role: "page-image",
      };
    }),
  };
};
TPP.zipSchemaOrgManifest = function (book, pages, options) {
  const metadata = TPP.zipManifestMetadata(book, pages, options);
  const doc = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: metadata.title,
    encodingFormat: "application/zip",
    inLanguage: metadata.language,
    numberOfPages: metadata.pageCount,
    keywords: metadata.keywords.join(", "),
    comment: metadata.archiveComment,
    datePublished: metadata.date || undefined,
    description: metadata.description || undefined,
    isbn: metadata.isbn13 || metadata.isbn || undefined,
    identifier: metadata.identifier || undefined,
    copyrightNotice: metadata.rights || undefined,
    author: metadata.creator
      ? {
          "@type": "Person",
          name: metadata.creator,
        }
      : undefined,
    publisher: metadata.publisher
      ? {
          "@type": "Organization",
          name: metadata.publisher,
        }
      : undefined,
    about: metadata.subjects.length
      ? metadata.subjects.map(function (subject) {
          return {
            "@type": "DefinedTerm",
            name: subject,
          };
        })
      : undefined,
    hasPart: metadata.files.map(function (file, index) {
      return {
        "@type": "ImageObject",
        name: "Page " + (index + 1),
        encodingFormat:
          "image/" + (metadata.imageFormat === "jpg" ? "jpeg" : metadata.imageFormat),
        contentUrl: file.name,
      };
    }),
  };
  return JSON.stringify(doc, null, 2) + "\n";
};
TPP.zipDublinCoreManifest = function (book, pages, options) {
  const metadata = TPP.zipManifestMetadata(book, pages, options);
  const escape = function (value) {
    if (typeof TPP.epubEscape === "function") return TPP.epubEscape(value);
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">',
    "  <dc:title>" + escape(metadata.title || "Untitled") + "</dc:title>",
  ];
  if (metadata.creator) {
    lines.push("  <dc:creator>" + escape(metadata.creator) + "</dc:creator>");
  }
  if (metadata.publisher) {
    lines.push("  <dc:publisher>" + escape(metadata.publisher) + "</dc:publisher>");
  }
  if (metadata.date) {
    lines.push("  <dc:date>" + escape(metadata.date) + "</dc:date>");
  }
  if (metadata.language) {
    lines.push("  <dc:language>" + escape(metadata.language) + "</dc:language>");
  }
  if (metadata.description) {
    lines.push("  <dc:description>" + escape(metadata.description) + "</dc:description>");
  }
  metadata.subjects.forEach(function (subject) {
    lines.push("  <dc:subject>" + escape(subject) + "</dc:subject>");
  });
  if (metadata.rights) {
    lines.push("  <dc:rights>" + escape(metadata.rights) + "</dc:rights>");
  }
  if (metadata.identifier) {
    lines.push("  <dc:identifier>" + escape(metadata.identifier) + "</dc:identifier>");
  }
  lines.push("  <dc:format>application/zip</dc:format>");
  lines.push("  <dc:type>Text</dc:type>");
  lines.push(
    "  <dc:relation>" +
      escape(metadata.pageCount + " page image files in " + metadata.imageFormat.toUpperCase()) +
      "</dc:relation>",
  );
  lines.push("</oai_dc:dc>");
  return lines.join("\n") + "\n";
};
TPP.zipFileIdDiz = function (book, pages, options) {
  const metadata = TPP.zipManifestMetadata(book, pages, options);
  const generator = TPP.generatorInfo();
  const maxLines = 10;
  const maxWidth = 45;
  const normalize = function (value) {
    return String(value || "")
      .replace(/[\r\n\t]+/g, " ")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/…/g, "...")
      .replace(/[^\x20-\x7e]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };
  const pushWrapped = function (lines, value) {
    let remaining = normalize(value);
    while (remaining && lines.length < maxLines) {
      if (remaining.length <= maxWidth) {
        lines.push(remaining);
        return;
      }
      let breakAt = remaining.lastIndexOf(" ", maxWidth);
      if (breakAt < Math.floor(maxWidth * 0.5)) breakAt = maxWidth;
      lines.push(remaining.slice(0, breakAt).trim());
      remaining = remaining.slice(breakAt).trim();
    }
  };
  const lines = [];
  pushWrapped(lines, metadata.title || generator.exportLabel);
  if (metadata.creator) pushWrapped(lines, "By " + metadata.creator);
  if (metadata.publisher || metadata.date) {
    pushWrapped(
      lines,
      [metadata.publisher, metadata.date].filter(Boolean).join(" | "),
    );
  }
  if (metadata.subjects.length) {
    pushWrapped(lines, "Topic: " + metadata.subjects[0]);
  }
  pushWrapped(
    lines,
    metadata.pageCount +
      " page images in " +
      metadata.imageFormat.toUpperCase() +
      " format",
  );
  if (metadata.description) {
    pushWrapped(lines, metadata.description);
  }
  if (metadata.rights && lines.length < maxLines) {
    pushWrapped(lines, metadata.rights);
  }
  return lines.slice(0, maxLines).join("\r\n") + "\r\n";
};
TPP.defaultLanguageCodeMap = {
  ar: "ara",
  de: "deu",
  en: "eng",
  es: "spa",
  fr: "fra",
  hi: "hin",
  id: "ind",
  it: "ita",
  ja: "jpn",
  ko: "kor",
  bn: "ben",
  pa: "pan",
  pl: "pol",
  pt: "por",
  ru: "rus",
  ta: "tam",
  te: "tel",
  tr: "tur",
  ur: "urd",
  vi: "vie",
  zh: "zho",
};
TPP.languageCodeMapDataPath = "data/language-code-map.json";
TPP.languageCodeMapCache = null;
TPP.languageCodeMapLoadPromise = null;
TPP.loadLanguageCodeMap = async function () {
  if (TPP.languageCodeMapCache) return TPP.languageCodeMapCache;
  if (TPP.languageCodeMapLoadPromise) return TPP.languageCodeMapLoadPromise;
  TPP.languageCodeMapLoadPromise = (async function () {
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.protocol === "file:"
    ) {
      TPP.languageCodeMapCache = Object.assign({}, TPP.defaultLanguageCodeMap);
      return TPP.languageCodeMapCache;
    }
    try {
      const response = await fetch(TPP.languageCodeMapDataPath);
      if (!response.ok) throw new Error("language code map");
      const data = await response.json();
      TPP.languageCodeMapCache =
        data && typeof data === "object"
          ? Object.assign({}, TPP.defaultLanguageCodeMap, data)
          : Object.assign({}, TPP.defaultLanguageCodeMap);
    } catch (_error) {
      TPP.languageCodeMapCache = Object.assign({}, TPP.defaultLanguageCodeMap);
    }
    return TPP.languageCodeMapCache;
  })();
  return TPP.languageCodeMapLoadPromise;
};
TPP.mp4LanguageCode = async function (book) {
  const source = book || {};
  const rawValue =
    typeof TPP.bookInfoValue === "function"
      ? TPP.bookInfoValue(source, "language")
      : source.language || "";
  const normalized =
    typeof TPP.parseLocaleParts === "function"
      ? TPP.parseLocaleParts(rawValue).language
      : String(rawValue || "").trim().toLowerCase();
  const code = String(normalized || "").trim().toLowerCase();
  if (!code) return "und";
  const map = await TPP.loadLanguageCodeMap();
  if (/^[a-z]{3}$/.test(code)) return code;
  return map[code] || "und";
};

TPP.pdfMetadata = function (book, options) {
  const source = book || {};
  const generator = TPP.generatorInfo();
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
  const classification = TPP.exportClassificationText(source);
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
    creator: generator.pdfCreator || generator.name,
    producer: generator.pdfProducer || generator.name,
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
TPP.pdfExportKindLabel = function (which) {
  if (which === "interior") return "text block pdf";
  if (which === "cover") return "cover pdf";
  if (which === "readable" || which === "ebook") return "ebook pdf";
  return String(which || "pdf").trim() || "pdf";
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
  const progressOp = TPP.beginProgressOperation(which + " PDF export");
  try {
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
  TPP.applyPdfMetadata(pdf, settings, {
    kind: TPP.pdfExportKindLabel(which),
  });
  const sheets = Array.from(container.querySelectorAll("[data-pdf-page]"));
  for (let i = 0; i < sheets.length; i++) {
    TPP.throwIfProgressCancelled(progressOp);
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
    TPP.throwIfProgressCancelled(progressOp);
    await new Promise(requestAnimationFrame);
    TPP.throwIfProgressCancelled(progressOp);
    const canvas = await html2canvas(
      el,
      TPP.html2canvasOptions({ scale: 3 }),
    );
    TPP.throwIfProgressCancelled(progressOp);
    TPP.showProgress(
      5 + Math.round(((i + 0.5) / sheets.length) * 90),
      "Rendered " +
        which +
        " PDF page " +
        (i + 1) +
        " of " +
        sheets.length +
        "…",
      { previewCanvas: canvas },
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
  TPP.throwIfProgressCancelled(progressOp);
  const name = TPP.exportFileName(settings, {
    extension: "pdf",
    kind: which,
  });
  TPP.applyPdfMetadata(pdf, settings, {
    kind: TPP.pdfExportKindLabel(which),
  });
  pdf.save(name);
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "PDF complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "PDF export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.exportReadablePdf = async function () {
  const progressOp = TPP.beginProgressOperation("eBook PDF export");
  try {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const pdf = new jspdf.jsPDF({
    orientation: settings.page.h >= settings.page.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.page.w, settings.page.h],
    compress: true,
  });
  TPP.applyPdfMetadata(pdf, settings, {
    kind: TPP.pdfExportKindLabel("ebook"),
  });
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.throwIfProgressCancelled(progressOp);
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
      TPP.throwIfProgressCancelled(progressOp);
      await new Promise(requestAnimationFrame);
      TPP.throwIfProgressCancelled(progressOp);
      const canvas = await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: 3 }),
      );
      TPP.throwIfProgressCancelled(progressOp);
      TPP.showProgress(
        5 + Math.round(((i + 0.5) / pages.length) * 90),
        "Rendered eBook PDF page " + (i + 1) + " of " + pages.length + "...",
        { previewCanvas: canvas },
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
  TPP.throwIfProgressCancelled(progressOp);
  const name = TPP.exportFileName(settings, {
    extension: "pdf",
    kind: "ebook",
  });
  TPP.applyPdfMetadata(pdf, settings, {
    kind: TPP.pdfExportKindLabel("ebook"),
  });
  pdf.save(name);
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "eBook PDF complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "eBook PDF export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
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
  const classification = TPP.exportClassificationText(source);
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
  const stem = TPP.exportBookStem(settings);
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

  const progressOp = TPP.beginProgressOperation("EPUB export");
  try {
  TPP.showProgress(5, "Preparing EPUB package...", { clearPreview: true });
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
  TPP.throwIfProgressCancelled(progressOp);
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
    TPP.throwIfProgressCancelled(progressOp);
    const chapter = chapterList[i];
    if (!chapter || chapter.isMetadata) continue;
      TPP.showProgress(
        15 + Math.round((i / Math.max(1, chapterList.length)) * 60),
        "Building EPUB chapter " + (i + 1) + " of " + chapterList.length + "...",
        {
          previewDataUrl:
            coverImage && coverImage.data ? String(coverImage.data) : undefined,
        },
      );
    const chapterTitle = chapter.title || "Chapter " + (i + 1);
    const chapterImageElement = TPP.findChapterImageElement(settings, chapter);
    TPP.throwIfProgressCancelled(progressOp);
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
      TPP.throwIfProgressCancelled(progressOp);
      TPP.showProgress(
        82 + Math.round(meta.percent * 0.18),
        "Compressing EPUB package...",
      );
    },
  );
  TPP.throwIfProgressCancelled(progressOp);
  TPP.downloadBlob(stem + ".epub", blob);
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "EPUB complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "EPUB export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.imageExportOptions = function (options) {
  const source = options || {};
  const rawThreshold = Number(source.threshold);
  const requestedFormat = ["png", "gif", "jpeg", "webp", "seq", "d64"].includes(
    source.format,
  )
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
  let colorDepth = requestedDepth === "websafe" ? "indexed" : requestedDepth;
  if (requestedFormat === "seq" || requestedFormat === "d64") {
    if (!["mono1", "indexed"].includes(colorDepth)) {
      colorDepth = "indexed";
    }
  }
  const rawDithering = String(source.dithering || "").trim().toLowerCase();
  const normalizedDithering =
    rawDithering === "none" ? "threshold" : rawDithering;
  let dithering = TPP.imageExportDitherIds().includes(normalizedDithering)
    ? normalizedDithering
    : "threshold";
  if (
    requestedFormat === "seq" &&
    ![
      "c64-petscii",
      "c64-petscii-full",
      "c64-custom-charset",
    ].includes(dithering)
  ) {
    dithering = "c64-petscii";
  }
  let targetWidth = Math.max(0, Math.round(Number(source.targetWidth) || 0)) || null;
  let targetHeight = Math.max(0, Math.round(Number(source.targetHeight) || 0)) || null;
  if (requestedFormat === "seq" || requestedFormat === "d64") {
    targetWidth = 320;
    targetHeight = 200;
  }
  return {
    dpi: TPP.dpi(source.dpi),
    targetWidth: targetWidth,
    targetHeight: targetHeight,
    format:
      colorDepth === "indexed" && !["png", "gif", "seq", "d64"].includes(requestedFormat)
        ? "png"
        : requestedFormat,
    quality: Math.max(1, Math.min(100, Number(source.quality) || 92)),
    colorDepth: colorDepth,
    threshold: Math.max(
      0,
      Math.min(255, Number.isFinite(rawThreshold) ? rawThreshold : 128),
    ),
    dithering: dithering,
    frameDelay: Math.max(
      1000,
      Math.min(10000, Number(source.frameDelay) || 1000),
    ),
    palette:
      requestedFormat === "seq" || requestedFormat === "d64"
        ? "c64"
        : requestedDepth === "websafe"
          ? "websafe"
          : TPP.imageExportPaletteIds().includes(source.palette)
            ? String(source.palette)
            : "websafe",
  };
};
TPP.imageExportRenderScale = function (settings, options) {
  const source = settings || {};
  const config = options || {};
  const targetPixels = TPP.imageExportTargetPixels(config);
  const pageWidthCss = Math.max(1, (Number(source.page && source.page.w) || 1) * 96);
  const pageHeightCss = Math.max(
    1,
    (Number(source.page && source.page.h) || 1) * 96,
  );
  if (targetPixels) {
    return Math.max(
      1,
      targetPixels.width / pageWidthCss,
      targetPixels.height / pageHeightCss,
    );
  }
  return Math.max(1, TPP.dpi(config.dpi) / 96);
};
TPP.fitCanvasToExportTarget = function (canvas, options) {
  const targetPixels = TPP.imageExportTargetPixels(options);
  if (!canvas || !targetPixels) return canvas;
  if (
    canvas.width === targetPixels.width &&
    canvas.height === targetPixels.height
  ) {
    return canvas;
  }
  const out = document.createElement("canvas");
  out.width = targetPixels.width;
  out.height = targetPixels.height;
  const ctx = out.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
TPP.imageExportDitherIds = function () {
  return [
    "threshold",
    "none",
    "bayer2",
    "bayer4",
    "bayer8",
    "floyd-steinberg",
    "jarvis-judice-ninke",
    "stucki",
    "burkes",
    "sierra",
    "atkinson",
    "halftone",
    "blue-noise",
    "random",
    "pattern",
    "c64-petscii",
    "c64-petscii-full",
    "c64-custom-charset",
  ];
};
TPP.imageExportCharsetToChrBytes = function (patterns) {
  if (!Array.isArray(patterns)) return null;
  const buffer = new Uint8Array(2048);
  let byteOffset = 0;
  patterns.forEach(function (mask) {
    if (byteOffset >= 2048) return;
    if (Array.isArray(mask) || mask instanceof Uint8Array) {
      for (let row = 0; row < 8 && byteOffset < 2048; row += 1) {
        let rowByte = 0;
        for (let col = 0; col < 8; col += 1) {
          const pixelIndex = row * 8 + col;
          const pixelValue = mask[pixelIndex] ? 1 : 0;
          rowByte = (rowByte << 1) | pixelValue;
        }
        buffer[byteOffset] = rowByte;
        byteOffset += 1;
      }
    }
  });
  return buffer;
};
TPP.imageExportSeqOptionsEnabled = function (options) {
  const config = TPP.imageExportOptions(options || {});
  return (
    config.format === "seq" &&
    config.targetWidth === 320 &&
    config.targetHeight === 200 &&
    config.palette === "c64" &&
    ["mono1", "indexed"].includes(config.colorDepth) &&
    [
      "c64-petscii",
      "c64-petscii-full",
      "c64-custom-charset",
    ].includes(config.dithering)
  );
};
TPP.exportSeqStem = function (book) {
  const stem = TPP.exportBookStem(book, {
    maxSegments: 1,
    includeAuthor: false,
    includeClassification: false,
  });
  const clean = String(TPP.exportFilenameSegment(stem, "tinybook", 8) || "tinybook")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return (clean || "TINYBOOK").slice(0, 8);
};
TPP.exportSeqFileName = function (book) {
  return TPP.exportSeqStem(book) + ".SEQ";
};
TPP.exportSeqPageFileName = function (book, pageIndex) {
  const stem = TPP.exportSeqStem(book);
  const pageToken = String(Math.max(1, Number(pageIndex) || 1)).padStart(4, "0");
  return stem.slice(0, Math.max(1, 8 - pageToken.length)) + pageToken + ".SEQ";
};
TPP.exportCharsetPageFileName = function (pageIndex, totalPages) {
  const pageNum = Math.max(1, Number(pageIndex) || 1);
  const totalCount = Math.max(1, Number(totalPages) || 1);
  let prefix, padLength;
  if (totalCount <= 9999) {
    prefix = "PAGE";
    padLength = 4;
  } else if (totalCount <= 99999) {
    prefix = "PAG";
    padLength = 5;
  } else if (totalCount <= 999999) {
    prefix = "PA";
    padLength = 6;
  } else if (totalCount <= 9999999) {
    prefix = "P";
    padLength = 7;
  } else {
    prefix = "";
    padLength = 8;
  }
  const pageToken = String(pageNum).padStart(padLength, "0");
  return (prefix + pageToken + ".CHR").toUpperCase();
};
TPP.imageExportSeqBytesForCanvas = async function (canvas, options) {
  if (!canvas || !canvas.width || !canvas.height) return null;
  const exportOptions = TPP.imageExportOptions(options);
  const palette = TPP.imageExportNamedPalette(exportOptions.palette);
  const ditherLib = await TPP.loadImageExportDither();
  if (!ditherLib || typeof ditherLib.buildImageExportSeqScreen !== "function") {
    return null;
  }
  const renderCanvas = canvas;
  const ctx = renderCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const image = ctx.getImageData(0, 0, renderCanvas.width, renderCanvas.height);
  return ditherLib.buildImageExportSeqScreen(
    image.data,
    renderCanvas.width,
    renderCanvas.height,
    palette,
    exportOptions,
  );
};
TPP.exportImageSeqPage = async function (options, pageIndex) {
  const progressOp = TPP.beginProgressOperation("SEQ page export");
  try {
    await TPP.ensureImageExportPaletteForOptionsLoaded(options);
    TPP.sync();
    const settings = TPP.settings();
    const pages = TPP.buildPages();
    const index = Math.max(1, Number(pageIndex) || 1);
    if (!pages.length || index > pages.length) {
      alert("No pages available to export.");
      return;
    }
    const exportOptions = TPP.imageExportOptions(options);
    const mount = document.createElement("div");
    mount.style.cssText =
      "position:fixed;left:-9999px;top:0;pointer-events:none;";
    document.body.appendChild(mount);
    try {
      const shell = TPP.createExportRenderShell(settings);
      mount.appendChild(shell);
      const page = pages[index - 1];
      const canvas = await TPP.renderExportPageCanvas(shell, page, settings, 1);
      const exportCanvas = TPP.fitCanvasToExportTarget(canvas, exportOptions);
      const seqBytes = await TPP.imageExportSeqBytesForCanvas(exportCanvas, exportOptions);
      if (!seqBytes || !seqBytes.length) {
        alert("SEQ export failed.");
        return;
      }
      const blob = new Blob([seqBytes], { type: "application/octet-stream" });
      TPP.downloadBlob(TPP.exportSeqPageFileName(settings, index), blob);
    } finally {
      mount.remove();
    }
    TPP.finishProgressOperation(progressOp);
    TPP.showProgress(100, "SEQ page export complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "SEQ page export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.exportImagesSeq = async function (options) {
  const progressOp = TPP.beginProgressOperation("SEQ export");
  try {
    await TPP.ensureImageExportPaletteForOptionsLoaded(options);
    TPP.sync();
    const settings = TPP.settings();
    const pages = TPP.buildPages();
    if (!pages.length) {
      alert("No pages available to export.");
      return;
    }
    const exportOptions = TPP.imageExportOptions(options);
    const mount = document.createElement("div");
    mount.style.cssText =
      "position:fixed;left:-9999px;top:0;pointer-events:none;";
    document.body.appendChild(mount);
    try {
      const shell = TPP.createExportRenderShell(settings);
      mount.appendChild(shell);
      const bytesList = [];
      for (let i = 0; i < pages.length; i += 1) {
        TPP.throwIfProgressCancelled(progressOp);
        TPP.showProgress(
          5 + Math.round((i / pages.length) * 80),
          "Rendering SEQ page " + (i + 1) + " of " + pages.length + "...",
        );
        const page = pages[i];
        const canvas = await TPP.renderExportPageCanvas(shell, page, settings, 1);
        const exportCanvas = TPP.fitCanvasToExportTarget(canvas, exportOptions);
        const seqBytes = await TPP.imageExportSeqBytesForCanvas(exportCanvas, exportOptions);
        if (!seqBytes || !seqBytes.length) {
          alert("SEQ export failed.");
          return;
        }
        bytesList.push(seqBytes);
      }
      const totalLength = bytesList.reduce(function (sum, item) {
        return sum + (item ? item.length : 0);
      }, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      bytesList.forEach(function (item) {
        combined.set(item, offset);
        offset += item.length;
      });
      const blob = new Blob([combined], { type: "application/octet-stream" });
      TPP.downloadBlob(TPP.exportSeqFileName(settings), blob);
    } finally {
      mount.remove();
    }
    TPP.finishProgressOperation(progressOp);
    TPP.showProgress(100, "SEQ export complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "SEQ export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
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
  "c64",
  "atari400base",
  "atari400",
  "cga0",
  "cga1",
];
TPP.imageExportAssetUrl = function (assetPath) {
  const value = String(assetPath || "").trim();
  if (!value) return value;
  try {
    return new URL(value, document.baseURI || window.location.href).href;
  } catch {
    return value;
  }
};
TPP.ensureFallbackWebsafePaletteAvailable = function () {
  if (!TPP.imageExportPaletteById.websafe) {
    TPP.imageExportPaletteById.websafe = TPP.fallbackWebsafePalette();
  }
  if (!TPP.imageExportPaletteCatalogById.websafe) {
    TPP.imageExportPaletteCatalogById.websafe = {
      id: "websafe",
      name: "Web-Safe",
      file: TPP.IMAGE_EXPORT_PALETTE_CATALOG,
    };
  }
  if (!TPP.imageExportPaletteIdsCached.includes("websafe")) {
    TPP.imageExportPaletteIdsCached = ["websafe"].concat(
      TPP.imageExportPaletteIdsCached.filter(function (id) {
        return id !== "websafe";
      }),
    );
  }
};
TPP.removeImageExportPaletteId = function (paletteId) {
  const id = String(paletteId || "").trim();
  if (!id || id === "websafe") return;
  delete TPP.imageExportPaletteById[id];
  delete TPP.imageExportPaletteCatalogById[id];
  delete TPP.imageExportPaletteLoadPromises[id];
  TPP.imageExportPaletteIdsCached = TPP.imageExportPaletteIdsCached.filter(function (value) {
    return value !== id;
  });
  if (!TPP.imageExportPaletteIdsCached.length) {
    TPP.ensureFallbackWebsafePaletteAvailable();
  }
};
TPP.imageExportPaletteDisplayName = function (paletteId) {
  const id = String(paletteId || "").trim() || "websafe";
  const meta = TPP.imageExportPaletteCatalogById[id];
  return meta && meta.name ? meta.name : id;
};
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
TPP.imageExportGrayscalePalette = function (count) {
  const size = Math.max(1, Math.min(256, Math.round(Number(count) || 2)));
  if (size === 1) return [[0, 0, 0]];
  const palette = [];
  for (let i = 0; i < size; i++) {
    const value = Math.round((i / (size - 1)) * 255);
    palette.push([value, value, value]);
  }
  return palette;
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
  const response = await fetch(TPP.imageExportAssetUrl(TPP.IMAGE_EXPORT_PALETTE_CATALOG), {
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
  if (!TPP.imageExportPaletteIdsCached.length) {
    TPP.ensureFallbackWebsafePaletteAvailable();
  }
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
          TPP.imageExportPaletteCatalogById = {
            websafe: {
              id: "websafe",
              name: "Web-Safe",
              file: TPP.IMAGE_EXPORT_PALETTE_CATALOG,
            },
          };
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
  const fileResponse = await fetch(TPP.imageExportAssetUrl(meta.file), {
    cache: "no-cache",
  });
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
        .catch(function (error) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("Palette load failed:", paletteId, error);
          }
          if (paletteId === "websafe") {
            TPP.ensureFallbackWebsafePaletteAvailable();
          } else {
            TPP.removeImageExportPaletteId(paletteId);
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
TPP.preloadImageExportPalettes = async function () {
  await TPP.ensureImageExportPaletteCatalogLoaded();
  const paletteIds = TPP.imageExportPaletteIds();
  await Promise.all(
    paletteIds.map(function (paletteId) {
      return TPP.ensureImageExportPaletteLoaded(paletteId);
    }),
  );
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
TPP.imageExportDitherLib = null;
TPP.imageExportDitherPromise = null;
TPP.loadImageExportDither = function () {
  if (TPP.imageExportDitherLib) return Promise.resolve(TPP.imageExportDitherLib);
  if (!TPP.imageExportDitherPromise) {
    TPP.imageExportDitherPromise = import("/js/image-export-dither.js")
      .then(function (module) {
        const api =
          module && typeof module.init === "function" ? module.init(TPP) : module;
        TPP.imageExportDitherLib = api || {};
        return TPP.imageExportDitherLib;
      })
      .catch(function (error) {
        TPP.imageExportDitherPromise = null;
        throw error;
      });
  }
  return TPP.imageExportDitherPromise;
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
TPP.exportCanvasForDepth = async function (
  canvas,
  colorDepth,
  threshold,
  paletteName,
  options,
) {
  if (!canvas || colorDepth === "color24") return canvas;
  const config = options || {};
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  const data = image.data;
  const rawThreshold = Number(threshold);
  const monoThreshold = Math.max(
    0,
    Math.min(255, Number.isFinite(rawThreshold) ? rawThreshold : 128),
  );
  const indexedPalette =
    colorDepth === "indexed" ? TPP.imageExportNamedPalette(paletteName) : null;
  const applyMonoDither =
    colorDepth === "mono1" &&
    !["threshold", "none"].includes(String(config.dithering || "threshold"));
  const applyIndexedDither =
    colorDepth === "indexed" &&
    !["threshold", "none"].includes(String(config.dithering || "threshold")) &&
    Array.isArray(indexedPalette) &&
    indexedPalette.length > 0;
  if (applyMonoDither) {
    const ditherLib = await TPP.loadImageExportDither();
    if (ditherLib && typeof ditherLib.applyMonoDither === "function") {
      ditherLib.applyMonoDither(data, out.width, out.height, {
        algorithm: String(config.dithering || "threshold"),
        threshold: monoThreshold,
      });
      ctx.putImageData(image, 0, 0);
      return out;
    }
  }
  if (applyIndexedDither) {
    const ditherLib = await TPP.loadImageExportDither();
    if (ditherLib && typeof ditherLib.applyPaletteDitherAsync === "function") {
      const progressCallback = typeof config.onProgress === "function"
        ? function (info) {
            ctx.putImageData(image, 0, 0);
            config.onProgress(Object.assign({}, info, { canvas: out }));
          }
        : null;
      await ditherLib.applyPaletteDitherAsync(
        data,
        out.width,
        out.height,
        indexedPalette,
        {
          algorithm: String(config.dithering || "threshold"),
          threshold: monoThreshold,
          selectionBias: monoThreshold,
          onProgress: progressCallback,
          progressIntervalMs: config.progressIntervalMs,
          yieldBudgetMs: config.yieldBudgetMs,
        },
      );
      ctx.putImageData(image, 0, 0);
      return out;
    }
    if (ditherLib && typeof ditherLib.applyPaletteDither === "function") {
      ditherLib.applyPaletteDither(data, out.width, out.height, indexedPalette, {
        algorithm: String(config.dithering || "threshold"),
        threshold: monoThreshold,
        selectionBias: monoThreshold,
      });
      ctx.putImageData(image, 0, 0);
      return out;
    }
  }
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
    TPP.applyIndexedPalette(data, indexedPalette);
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
  const fields = TPP.exportMetadataFields(book);
  return TPP.condensedMetadataText(
    [
      { label: "Publisher", value: fields.publisher },
      { label: "Classification", value: fields.classification },
      { label: "Keywords", value: fields.keywords },
      { label: "Rights", value: fields.rights },
    ],
    {
      separator: " | ",
      maxLength: 240,
      measure: "chars",
    },
  );
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
  const sourceBook = options && options.book ? options.book : TPP.settings();
  const rgba = TPP.canvasRgba(canvas);
  const frame = TPP.gifFrameFromRgba(
    rgba,
    canvas.width,
    canvas.height,
    exportOptions,
    lib,
    null,
  );
  const gif = lib.GIFEncoder({ auto: false });
  gif.writeHeader();
  gif.writeFrame(frame.index, canvas.width, canvas.height, {
    first: true,
    palette: frame.palette,
    delay: exportOptions.frameDelay,
  });
  gif.finish();
  const commentText = TPP.gifCommentText(sourceBook, {
    pageIndex: options && options.pageIndex,
    totalPages: options && options.totalPages,
  });
  const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
  return new Blob([TPP.insertGifCommentBeforeImage(bytes, commentText)], {
    type: "image/gif",
  });
};
TPP.exportBlobForCanvas = function (canvas, options) {
  if (!canvas) return Promise.resolve(null);
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.format === "seq") {
    return Promise.resolve()
      .then(function () {
        return TPP.imageExportSeqBytesForCanvas(canvas, Object.assign({}, options || {}, exportOptions));
      })
      .then(function (bytes) {
        return bytes
          ? new Blob([bytes], { type: "application/octet-stream" })
          : null;
      });
  }
  if (exportOptions.format === "gif")
    return TPP.encodeGifBlob(canvas, Object.assign({}, options || {}, exportOptions));
  const mime =
    exportOptions.format === "jpeg"
      ? "image/jpeg"
      : exportOptions.format === "webp"
        ? "image/webp"
        : "image/png";
  return new Promise(function (resolve) {
    canvas.toBlob(
      async function (blob) {
        if (!blob) {
          resolve(null);
          return;
        }
        try {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const sourceBook = options && options.book ? options.book : TPP.settings();
          if (exportOptions.format === "png") {
            const metadataBytes = TPP.insertPngMetadata(
              bytes,
              TPP.pngTextEntries(sourceBook, {
                pageIndex: options && options.pageIndex,
                totalPages: options && options.totalPages,
              }),
            );
            resolve(new Blob([metadataBytes], { type: "image/png" }));
            return;
          }
          if (exportOptions.format === "jpeg") {
            const metadataBytes = TPP.insertJpegMetadata(bytes, sourceBook, {
              pageIndex: options && options.pageIndex,
              totalPages: options && options.totalPages,
              generatedAt: options && options.generatedAt,
            });
            resolve(new Blob([metadataBytes], { type: "image/jpeg" }));
            return;
          }
          if (exportOptions.format === "webp") {
            const metadataBytes = TPP.insertWebpMetadata(bytes, sourceBook, {
              pageIndex: options && options.pageIndex,
              totalPages: options && options.totalPages,
              generatedAt: options && options.generatedAt,
              width: canvas.width,
              height: canvas.height,
              hasAlpha: TPP.canvasHasTransparency(canvas),
              canvas: canvas,
            });
            resolve(new Blob([metadataBytes], { type: "image/webp" }));
            return;
          }
          resolve(blob);
        } catch (_error) {
          resolve(blob);
        }
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
  const progressOp = TPP.beginProgressOperation("Page images ZIP export");
  try {
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
  const scale = TPP.imageExportRenderScale(settings, exportOptions);
  const extension =
    exportOptions.format === "jpeg" ? "jpg" : exportOptions.format;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.throwIfProgressCancelled(progressOp);
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
      TPP.throwIfProgressCancelled(progressOp);
      await new Promise(requestAnimationFrame);
      TPP.throwIfProgressCancelled(progressOp);
      const canvas = TPP.fitCanvasToExportTarget(
        await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: scale }),
        ),
        exportOptions,
      );
      TPP.throwIfProgressCancelled(progressOp);
      const exportCanvas = await TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
        exportOptions,
      );
      TPP.showProgress(
        5 + Math.round(((i + 0.5) / pages.length) * 80),
        "Rendered page image " + (i + 1) + " of " + pages.length + "...",
        { previewCanvas: exportCanvas },
      );
      const blob = await TPP.exportBlobForCanvas(
        exportCanvas,
        Object.assign({}, exportOptions, {
          book: settings,
          pageIndex: i + 1,
          totalPages: pages.length,
        }),
      );
      const pageName = TPP.exportPageFileName(settings, i + 1, {
        format: extension,
        totalPages: pages.length,
      });
      zip.file(pageName, blob);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    TPP.throwIfProgressCancelled(progressOp);
    zip.file("manifest.jsonld", TPP.zipSchemaOrgManifest(settings, pages, exportOptions));
    zip.file("metadata.dc.xml", TPP.zipDublinCoreManifest(settings, pages, exportOptions));
    zip.file("FILE_ID.DIZ", TPP.zipFileIdDiz(settings, pages, exportOptions));
    TPP.showProgress(90, "Building ZIP archive...");
    const blob = await zip.generateAsync(
      {
        type: "blob",
        comment: TPP.zipCommentText(settings),
      },
      function (meta) {
        TPP.throwIfProgressCancelled(progressOp);
        TPP.showProgress(
          90 + Math.round(meta.percent * 0.1),
          "Building ZIP archive...",
        );
      },
    );
    TPP.throwIfProgressCancelled(progressOp);
    const name = TPP.exportFileName(settings, {
      extension: "zip",
      kind: exportOptions.format,
      qualifiers: TPP.imageExportTargetPixels(exportOptions)
        ? [
            TPP.imageExportTargetPixels(exportOptions).width +
              "x" +
              TPP.imageExportTargetPixels(exportOptions).height,
          ]
        : [targetDpi + "dpi"],
    });
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "Page images ZIP complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "Page images ZIP export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.d64TrackSectorCount = function (track) {
  if (track >= 1 && track <= 17) return 21;
  if (track >= 18 && track <= 24) return 19;
  if (track >= 25 && track <= 30) return 18;
  if (track >= 31 && track <= 35) return 17;
  return 0;
};
TPP.d64TrackOffset = function (track, sector) {
  let offset = 0;
  for (let t = 1; t < track; t += 1) {
    offset += 256 * TPP.d64TrackSectorCount(t);
  }
  return offset + 256 * sector;
};
TPP.d64EncodeFileName = function (name, maxLength) {
  const result = new Uint8Array(maxLength || 16).fill(0xa0);
  const value = String(name || "").toUpperCase();
  let index = 0;
  for (let i = 0; i < value.length && index < result.length; i += 1) {
    const ch = value[i];
    const code = value.charCodeAt(i);
    if ((code >= 65 && code <= 90) || (code >= 48 && code <= 57)) {
      result[index++] = code;
    } else if (ch === ".") {
      result[index++] = 0x2e;
    } else if (code === 32) {
      result[index++] = 0xa0;
    } else {
      result[index++] = code;
    }
  }
  return result;
};
TPP.d64CreateBamSector = function (freeMap, diskName) {
  const sector = new Uint8Array(256);
  sector[0] = 18;
  sector[1] = 1;
  sector[2] = 0x41;
  sector[3] = 0x00;
  for (let track = 1; track <= 35; track += 1) {
    const trackOffset = 0x04 + (track - 1) * 4;
    const sectorCount = TPP.d64TrackSectorCount(track);
    let freeCount = 0;
    const bitmask = [0, 0, 0];
    for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
      const isFree = Boolean(
        freeMap[track] && freeMap[track][sectorIndex],
      );
      if (isFree) {
        freeCount += 1;
        const byteIndex = sectorIndex >> 3;
        const bitIndex = sectorIndex & 7;
        bitmask[byteIndex] |= 1 << bitIndex;
      }
    }
    sector[trackOffset] = freeCount;
    sector[trackOffset + 1] = bitmask[0];
    sector[trackOffset + 2] = bitmask[1];
    sector[trackOffset + 3] = bitmask[2];
  }
  const nameBytes = TPP.d64EncodeFileName(diskName || "TINYBOOK", 16);
  sector.set(nameBytes, 0x90);
  sector[0xa0] = 0xa0;
  sector[0xa1] = 0xa0;
  sector[0xa2] = 0x54;
  sector[0xa3] = 0x50;
  sector[0xa4] = 0xa0;
  sector[0xa5] = 0x32;
  sector[0xa6] = 0x41;
  sector[0xa7] = 0xa0;
  sector[0xa8] = 0xa0;
  return sector;
};
TPP.d64CreateDirectorySector = function (entries, sectorIndex, totalSectors) {
  const sector = new Uint8Array(256);
  const entriesPerSector = 8;
  for (let entryIndex = 0; entryIndex < entriesPerSector; entryIndex += 1) {
    const entry = entries[sectorIndex * entriesPerSector + entryIndex];
    if (!entry) break;
    sector.set(entry, entryIndex * 32);
  }
  if (sectorIndex < totalSectors - 1) {
    sector[0] = 18;
    sector[1] = sectorIndex + 2;
  } else {
    sector[0] = 0;
    sector[1] = 255;
  }
  return sector;
};
TPP.d64CreateDirectoryEntry = function (filename, type, startTrack, startSector, sectorCount) {
  const entry = new Uint8Array(32).fill(0);
  entry[2] = type;
  entry[3] = startTrack;
  entry[4] = startSector;
  entry.set(TPP.d64EncodeFileName(filename, 16), 5);
  entry[30] = sectorCount & 0xff;
  entry[31] = (sectorCount >> 8) & 0xff;
  return entry;
};
TPP.d64AllocateSectors = function (count, allocation) {
  const result = [];
  for (let track = allocation.track; track <= 35 && result.length < count; track += 1) {
    if (track === 18) continue;
    const sectorCount = TPP.d64TrackSectorCount(track);
    allocation.map[track] = allocation.map[track] || new Array(sectorCount).fill(true);
    for (let sector = allocation.sector; sector < sectorCount && result.length < count; sector += 1) {
      if (!allocation.map[track][sector]) continue;
      allocation.map[track][sector] = false;
      result.push({ track: track, sector: sector });
    }
    allocation.sector = 0;
  }
  if (result.length) {
    const last = result[result.length - 1];
    allocation.track = last.track;
    allocation.sector = last.sector + 1;
    if (allocation.sector >= TPP.d64TrackSectorCount(allocation.track)) {
      allocation.track += 1;
      allocation.sector = 0;
    }
  }
  return result;
};
TPP.d64WriteFile = function (image, data, allocation) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
  const sectors = Math.max(1, Math.ceil(bytes.length / 254));
  const blocks = TPP.d64AllocateSectors(sectors, allocation);
  if (blocks.length < sectors) return null;
  for (let i = 0; i < sectors; i += 1) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];
    const offset = TPP.d64TrackOffset(block.track, block.sector);
    const sector = image.subarray(offset, offset + 256);
    const sliceStart = i * 254;
    const sliceEnd = sliceStart + 254;
    const chunk = bytes.subarray(sliceStart, sliceEnd);
    sector[0] = nextBlock ? nextBlock.track : 0;
    sector[1] = nextBlock ? nextBlock.sector : Math.max(1, chunk.length + 1);
    sector.set(chunk, 2);
  }
  return {
    startTrack: blocks[0].track,
    startSector: blocks[0].sector,
    sectorCount: sectors,
  };
};
TPP.d64FinalizeImage = function (image, allocation, dirSectors, diskName) {
  const freeMap = {};
  for (let track = 1; track <= 35; track += 1) {
    const sectorCount = TPP.d64TrackSectorCount(track);
    freeMap[track] = new Array(sectorCount).fill(true);
  }
  // Reserve track 18 for BAM and directory.
  const track18Count = TPP.d64TrackSectorCount(18);
  for (let sector = 0; sector < track18Count; sector += 1) {
    freeMap[18][sector] = false;
  }
  for (const allocationTrack in allocation.map) {
    if (!Object.prototype.hasOwnProperty.call(allocation.map, allocationTrack)) continue;
    const trackIndex = Number(allocationTrack);
    freeMap[trackIndex] = allocation.map[trackIndex].slice();
  }
  for (let sector = dirSectors + 1; sector < track18Count; sector += 1) {
    freeMap[18][sector] = true;
  }
  const bamSector = TPP.d64CreateBamSector(freeMap, diskName);
  image.set(bamSector, TPP.d64TrackOffset(18, 0));
  for (let index = 0; index < dirSectors; index += 1) {
    image.set(allocation.directorySectors[index], TPP.d64TrackOffset(18, 1 + index));
  }
};
TPP.buildD64Image = function (files, book) {
  const image = new Uint8Array(174848);
  const allocation = {
    track: 1,
    sector: 0,
    map: {},
    directorySectors: [],
  };
  const directoryEntries = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const fileRecord = TPP.d64WriteFile(image, file.data, allocation);
    if (!fileRecord) return null;
    directoryEntries.push(
      TPP.d64CreateDirectoryEntry(
        file.name,
        file.type,
        fileRecord.startTrack,
        fileRecord.startSector,
        fileRecord.sectorCount,
      ),
    );
  }
  const entriesPerDirectorySector = 8;
  const dirSectors = Math.max(1, Math.ceil(directoryEntries.length / entriesPerDirectorySector));
  if (dirSectors > TPP.d64TrackSectorCount(18) - 1) return null;
  for (let i = 0; i < dirSectors; i += 1) {
    allocation.directorySectors.push(
      TPP.d64CreateDirectorySector(directoryEntries, i, dirSectors),
    );
  }
  TPP.d64FinalizeImage(image, allocation, dirSectors, book && book.title);
  return image;
};
TPP.exportD64FileName = function (book) {
  return TPP.exportFileName(book, { extension: "d64", kind: "c64" });
};
TPP.exportD64PageFileName = function (pageIndex) {
  return "PAGE" + String(Math.max(1, Number(pageIndex) || 1)).padStart(4, "0") + "DAT";
};
TPP.exportD64CharsetPageFileName = function (pageIndex) {
  return "PAGE" + String(Math.max(1, Number(pageIndex) || 1)).padStart(4, "0") + "CHR";
};
TPP.exportD64TocRecords = function (book) {
  const settings = book || {};
  if (!settings || !settings.toc || settings.toc.enabled === false) return [];
  const chapters = Array.isArray(settings.chapters) ? settings.chapters : [];
  return chapters.reduce(function (records, chapter, index) {
    if (!chapter || chapter.includeInToc === false) return records;
    const baseTitle =
      (chapter.tocTitle && String(chapter.tocTitle).trim()) ||
      (chapter.title && String(chapter.title).trim()) ||
      "CHAPTER " + String(index + 1);
    const level = Math.max(0, Number(chapter.level) || 0);
    const title = " ".repeat(level) + baseTitle;
    records.push({
      title: title.slice(0, 255),
      pointer: 0xffff,
    });
    return records;
  }, []);
};
TPP.exportD64TocIndexAndData = function (book) {
  const records = TPP.exportD64TocRecords(book);
  const datBytes = [];
  records.forEach(function (record) {
    const titleBytes = Array.from(String(record.title || "").toUpperCase(), function (char) {
      return char.charCodeAt(0) & 0xff;
    });
    datBytes.push(titleBytes.length & 0xff);
    datBytes.push.apply(datBytes, titleBytes);
    datBytes.push(record.pointer & 0xff, (record.pointer >> 8) & 0xff);
  });
  const idxBytes = [];
  if (records.length) {
    idxBytes.push(0x54, 0x4f, 0x43);
    idxBytes.push(0x00, 0x00);
    idxBytes.push(datBytes.length & 0xff, (datBytes.length >> 8) & 0xff);
  }
  return {
    hasToc: records.length > 0,
    indexBytes: new Uint8Array(idxBytes),
    dataBytes: new Uint8Array(datBytes),
    records: records,
  };
};
TPP.exportD64BootProgramBytes = function (book, pageCount, options) {
  const basicStart = 0x0801;
  const tokens = {
    END: 0x80,
    FOR: 0x81,
    NEXT: 0x82,
    DIM: 0x86,
    GOTO: 0x89,
    GOSUB: 0x8d,
    RETURN: 0x8e,
    REM: 0x8f,
    GOTO: 0x89,
    IF: 0x8b,
    "PRINT#": 0x98,
    PRINT: 0x99,
    OPEN: 0x9f,
    CLOSE: 0xa0,
    GET: 0xa1,
    TO: 0xa4,
    THEN: 0xa7,
    AND: 0xaf,
    OR: 0xb0,
    CHR$: 0xc7,
    LEFT$: 0xc8,
    MID$: 0xca,
    LEN: 0xc3,
    STR$: 0xc4,
    ASC: 0xc6,
    "=": 0xb2,
    ">": 0xb1,
    "<": 0xb3,
    "+": 0xaa,
    "-": 0xab,
    "*": 0xac,
    "/": 0xad,
  };
  const config = options || {};
  const hasToc = Boolean(config.hasToc);
  const normalizeLineText = function (value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  };
  const wrapText = function (value, width) {
    const normalized = normalizeLineText(value);
    if (!normalized) return [];
    const words = normalized.split(" ");
    const lines = [];
    let current = "";
    for (let i = 0; i < words.length; i += 1) {
      const next = current ? current + " " + words[i] : words[i];
      if (next.length > width && current) {
        lines.push(current);
        current = words[i];
      } else if (next.length > width) {
        lines.push(next.slice(0, width));
        current = next.slice(width).trim();
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
    return lines;
  };
  const stringBytes = function (value) {
    return Array.from(String(value || ""), function (char) {
      return char.charCodeAt(0) & 0xff;
    });
  };
  const encodeBasicBody = function (source) {
    const text = String(source || "");
    const bytes = [];
    const orderedTokens = Object.keys(tokens)
      .sort(function (a, b) {
        return b.length - a.length;
      });
    const isWordChar = function (char) {
      return /[A-Z0-9$]/.test(char || "");
    };
    let inQuote = false;
    for (let index = 0; index < text.length;) {
      const char = text[index];
      if (char === '"') {
        inQuote = !inQuote;
        bytes.push(0x22);
        index += 1;
        continue;
      }
      if (inQuote) {
        bytes.push(char.charCodeAt(0) & 0xff);
        index += 1;
        continue;
      }
      const upper = text.slice(index).toUpperCase();
      let matched = null;
      for (let tokenIndex = 0; tokenIndex < orderedTokens.length; tokenIndex += 1) {
        const tokenText = orderedTokens[tokenIndex];
        if (!upper.startsWith(tokenText)) continue;
        const prev = index > 0 ? text[index - 1].toUpperCase() : "";
        const next = text[index + tokenText.length]
          ? text[index + tokenText.length].toUpperCase()
          : "";
        const isOperator = tokenText.length === 1 && !/[A-Z]/.test(tokenText);
        const boundaryOk =
          isOperator ||
          (!isWordChar(prev) && !isWordChar(next));
        if (!boundaryOk) continue;
        matched = tokenText;
        break;
      }
      if (matched) {
        bytes.push(tokens[matched]);
        index += matched.length;
      } else {
        bytes.push(char.charCodeAt(0) & 0xff);
        index += 1;
      }
    }
    return bytes;
  };
  const basicLines = [];
  const pushLine = function (lineNumber, body) {
    basicLines.push({
      number: lineNumber,
      body: Array.isArray(body) ? body.slice() : encodeBasicBody(body),
    });
  };
  const titleLines = wrapText(
    (book && book.title) || "UNTITLED BOOK",
    34,
  );
  const authorLines = wrapText(
    (book && (book.by || book.author)) || "UNKNOWN AUTHOR",
    30,
  );
  const totalPages = Math.max(1, Number(pageCount) || 1);
  pushLine(5, 'DIM T$(200)');
  pushLine(10, 'PRINT CHR$(147)');
  pushLine(20, 'PRINT "TINY POCKETS PRESS"');
  pushLine(30, 'PRINT');
  let lineNumber = 40;
  titleLines.forEach(function (line) {
    pushLine(lineNumber, 'PRINT "' + (lineNumber === 40 ? "TITLE: " : "       ") + line + '"');
    lineNumber += 10;
  });
  authorLines.forEach(function (line, index) {
    pushLine(lineNumber, 'PRINT "' + (index === 0 ? "AUTHOR: " : "        ") + line + '"');
    lineNumber += 10;
  });
  pushLine(lineNumber, 'PRINT "PAGES: ' + String(totalPages) + '"');
  lineNumber += 10;
  pushLine(lineNumber, 'PRINT');
  lineNumber += 10;
  if (hasToc) {
    pushLine(lineNumber, 'PRINT "PRESS T FOR CONTENTS"');
    lineNumber += 10;
  }
  pushLine(lineNumber, 'PRINT "PRESS Q TO QUIT"');
  lineNumber += 10;
  const pollLine = lineNumber;
  pushLine(lineNumber, 'GET A$:IF A$="" THEN ' + String(lineNumber));
  lineNumber += 10;
  pushLine(lineNumber, 'IF A$="Q" THEN 900');
  lineNumber += 10;
  if (hasToc) {
    pushLine(lineNumber, 'IF A$="T" THEN 300');
    lineNumber += 10;
  }
  pushLine(lineNumber, 'GOTO ' + String(pollLine));
  if (hasToc) {
    pushLine(300, 'GOSUB 600');
    pushLine(310, 'IF TC=0 THEN PRINT:PRINT "NO TABLE OF CONTENTS.":GOSUB 1000:GOTO 10');
    pushLine(320, 'PG=0');
    pushLine(330, 'GOSUB 800');
    pushLine(340, 'GET A$:IF A$="" THEN 340');
    pushLine(350, 'IF A$="H" THEN 10');
    pushLine(360, 'IF A$="N" THEN IF (PG+1)*9<TC THEN PG=PG+1:GOTO 330');
    pushLine(370, 'IF A$="P" THEN IF PG>0 THEN PG=PG-1:GOTO 330');
    pushLine(380, 'GOTO 340');
    pushLine(600, 'IF TL=1 THEN RETURN');
    pushLine(610, 'TL=1:TC=0');
    pushLine(620, 'OPEN 2,8,2,"BOOK.IDX,S,R"');
    pushLine(630, 'GET#2,A$:IF ST<>0 THEN CLOSE 2:RETURN');
    pushLine(640, 'K$=A$:GET#2,A$:K$=K$+A$:GET#2,A$:K$=K$+A$');
    pushLine(650, 'GET#2,A$:IF A$="" THEN TP=0:GOTO 655');
    pushLine(652, 'TP=ASC(A$)');
    pushLine(655, 'GET#2,A$:IF A$="" THEN 659');
    pushLine(657, 'TP=TP+256*ASC(A$)');
    pushLine(659, 'GET#2,A$:IF A$="" THEN LN=0:GOTO 665');
    pushLine(662, 'LN=ASC(A$)');
    pushLine(665, 'GET#2,A$:IF A$="" THEN 669');
    pushLine(667, 'LN=LN+256*ASC(A$)');
    pushLine(669, 'CLOSE 2');
    pushLine(680, 'IF K$<>"TOC" THEN RETURN');
    pushLine(690, 'OPEN 3,8,3,"BOOK.DAT,S,R"');
    pushLine(700, 'FOR I=1 TO TP:GET#3,A$:NEXT');
    pushLine(710, 'RD=0');
    pushLine(720, 'IF RD>=LN OR TC>=200 THEN CLOSE 3:RETURN');
    pushLine(730, 'GET#3,A$:IF ST<>0 THEN CLOSE 3:RETURN');
    pushLine(735, 'IF A$="" THEN LL=0:RD=RD+1:IF LL=0 THEN CLOSE 3:RETURN');
    pushLine(740, 'LL=ASC(A$):RD=RD+1:IF LL=0 THEN CLOSE 3:RETURN');
    pushLine(750, 'TC=TC+1:T$(TC)=""');
    pushLine(760, 'FOR J=1 TO LL:GET#3,A$:T$(TC)=T$(TC)+A$:NEXT');
    pushLine(770, 'RD=RD+LL');
    pushLine(780, 'GET#3,A$:GET#3,A$:RD=RD+2');
    pushLine(790, 'GOTO 720');
    pushLine(800, 'PRINT CHR$(147)');
    pushLine(810, 'PRINT "TABLE OF CONTENTS"');
    pushLine(820, 'PRINT');
    pushLine(830, 'S=PG*9+1:E=S+8:IF E>TC THEN E=TC');
    pushLine(840, 'FOR I=S TO E:GOSUB 1100:NEXT');
    pushLine(850, 'PRINT');
    pushLine(860, 'PRINT "P/PREV N/NEXT H/HOME"');
    pushLine(870, 'RETURN');
    pushLine(1000, 'GET A$:IF A$="" THEN 1000');
    pushLine(1010, 'RETURN');
    pushLine(1100, 'X=I-S+1:P$=MID$(STR$(X),2)+". ":L$=T$(I)');
    pushLine(1110, 'LS=0');
    pushLine(1120, 'IF MID$(L$,LS+1,1)=" " THEN LS=LS+1:GOTO 1120');
    pushLine(1130, 'I$=""');
    pushLine(1140, 'FOR K=1 TO LEN(P$)+LS:I$=I$+" ":NEXT');
    pushLine(1150, 'W=40-LEN(P$)-LS');
    pushLine(1160, 'IF LEN(L$)<=W+LS THEN PRINT P$;L$:RETURN');
    pushLine(1170, 'B=W+LS');
    pushLine(1180, 'IF MID$(L$,B,1)<>" " AND B>LS+1 THEN B=B-1:GOTO 1180');
    pushLine(1190, 'IF B<=LS+1 THEN B=W+LS');
    pushLine(1200, 'PRINT P$;LEFT$(L$,B)');
    pushLine(1210, 'L$=MID$(L$,B+1)');
    pushLine(1220, 'P$=I$');
    pushLine(1230, 'W=40-LEN(P$)');
    pushLine(1240, 'IF LEN(L$)<=W THEN PRINT P$;L$:RETURN');
    pushLine(1250, 'B=W');
    pushLine(1260, 'IF MID$(L$,B,1)<>" " AND B>1 THEN B=B-1:GOTO 1260');
    pushLine(1270, 'IF B=1 THEN B=W');
    pushLine(1280, 'PRINT P$;LEFT$(L$,B)');
    pushLine(1290, 'L$=MID$(L$,B+1)');
    pushLine(1300, 'GOTO 1230');
  }
  pushLine(900, 'PRINT');
  pushLine(910, 'PRINT "QUIT TO BASIC (Y/N)?"');
  pushLine(920, 'GET A$:IF A$="" THEN 920');
  pushLine(930, 'IF A$="Y" THEN END');
  pushLine(940, 'IF A$="N" THEN 10');
  pushLine(950, 'GOTO 920');
  const buffer = [];
  let address = basicStart;
  basicLines.forEach(function (line) {
    const nextAddress = address + 4 + line.body.length + 1;
    buffer.push(nextAddress & 0xff, (nextAddress >> 8) & 0xff);
    buffer.push(line.number & 0xff, (line.number >> 8) & 0xff);
    buffer.push.apply(buffer, line.body);
    buffer.push(0x00);
    address = nextAddress;
  });
  buffer.push(0x00, 0x00);
  const blob = new Uint8Array(buffer.length + 2);
  blob[0] = 0x01;
  blob[1] = 0x08;
  blob.set(buffer, 2);
  return blob;
};
TPP.exportFileIdDizText = function (book) {
  const title = book && book.title ? String(book.title) : "Tiny book";
  const author = book && book.by ? String(book.by) : "Unknown author";
  return (title + " by " + author + "\r\n" + "D64 package generated by Tiny Pockets Press\r\n").toUpperCase();
};
TPP.exportImagesD64 = async function (options) {
  const progressOp = TPP.beginProgressOperation("D64 export");
  try {
    await TPP.ensureImageExportPaletteForOptionsLoaded(options);
    TPP.sync();
    const settings = TPP.settings();
    const pages = TPP.buildPages();
    if (!pages.length) {
      alert("No pages available to export.");
      return;
    }
    const exportOptions = TPP.imageExportOptions(options);
    const mount = document.createElement("div");
    mount.style.cssText =
      "position:fixed;left:-9999px;top:0;pointer-events:none;";
    document.body.appendChild(mount);
    try {
      const shell = TPP.createExportRenderShell(settings);
      mount.appendChild(shell);
      const tocFiles = TPP.exportD64TocIndexAndData(settings);
      const d64Files = [
        {
          name: "BOOK.PRG",
          type: 0x82,
          data: TPP.exportD64BootProgramBytes(settings, pages.length, {
            hasToc: tocFiles.hasToc,
          }),
        },
        {
          name: "BOOK.IDX",
          type: 0x81,
          data: tocFiles.indexBytes,
        },
        {
          name: "BOOK.DAT",
          type: 0x81,
          data: tocFiles.dataBytes,
        },
      ];
      for (let i = 0; i < pages.length; i += 1) {
        TPP.throwIfProgressCancelled(progressOp);
        TPP.showProgress(
          5 + Math.round((i / pages.length) * 80),
          "Rendering page " + (i + 1) + " of " + pages.length + "...",
        );
        const page = pages[i];
        const canvas = await TPP.renderExportPageCanvas(shell, page, settings, 1);
        const exportCanvas = TPP.fitCanvasToExportTarget(canvas, exportOptions);
        const seqBytes = await TPP.imageExportSeqBytesForCanvas(exportCanvas, exportOptions);
        if (!seqBytes || !seqBytes.length) {
          alert("D64 export failed while generating page data.");
          return;
        }
        d64Files.push({
          name: TPP.exportD64PageFileName(i + 1),
          type: 0x81,
          data: seqBytes,
        });
        const sheet = TPP.buildImageExportCustomCharsetSheet(
          exportCanvas,
          TPP.imageExportNamedPalette(exportOptions.palette),
          {
            cellSize: 8,
            cols: 16,
            selectionBias: exportOptions.threshold,
          },
        );
        const chrBytes = sheet && sheet.patterns
          ? TPP.imageExportCharsetToChrBytes(sheet.patterns)
          : null;
        if (chrBytes) {
          d64Files.push({
            name: TPP.exportD64CharsetPageFileName(i + 1),
            type: 0x81,
            data: chrBytes,
          });
        }
      }
      d64Files.push({
        name: "FILE_ID.DIZ",
        type: 0x81,
        data: new TextEncoder().encode(TPP.exportFileIdDizText(settings)),
      });
      const imageBytes = TPP.buildD64Image(d64Files, settings);
      if (!imageBytes) {
        alert("Failed to build D64 disk image.");
        return;
      }
      const blob = new Blob([imageBytes], { type: "application/octet-stream" });
      TPP.downloadBlob(TPP.exportD64FileName(settings), blob);
    } finally {
      mount.remove();
    }
    TPP.finishProgressOperation(progressOp);
    TPP.showProgress(100, "Commodore 64 D64 export complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "D64 export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.exportAnimatedGif = async function (options) {
  const progressOp = TPP.beginProgressOperation("Animated GIF export");
  try {
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
  const gif = lib.GIFEncoder({ auto: false });
  gif.writeHeader();
  const mount = document.createElement("div");
  const scale = TPP.imageExportRenderScale(settings, exportOptions);
  let previousRgba = null;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.throwIfProgressCancelled(progressOp);
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
      TPP.throwIfProgressCancelled(progressOp);
      await new Promise(requestAnimationFrame);
      TPP.throwIfProgressCancelled(progressOp);
      const canvas = TPP.fitCanvasToExportTarget(
        await html2canvas(
        shell,
        TPP.html2canvasOptions({ scale: scale }),
        ),
        exportOptions,
      );
      TPP.throwIfProgressCancelled(progressOp);
      const exportCanvas = await TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
        exportOptions,
      );
      TPP.showProgress(
        5 + Math.round(((i + 0.5) / pages.length) * 80),
        "Rendered GIF frame " + (i + 1) + " of " + pages.length + "...",
        { previewCanvas: exportCanvas },
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
        first: i === 0,
        palette: frame.palette,
        delay: exportOptions.frameDelay,
        repeat: i === 0 ? 0 : undefined,
        transparent: frame.transparent || undefined,
        transparentIndex: frame.transparent
          ? frame.transparentIndex
          : undefined,
        dispose: frame.transparent ? frame.dispose : undefined,
      });
      if (i === 0) {
        TPP.writeGifCommentExtension(gif, TPP.gifCommentText(settings));
      }
      previousRgba = new Uint8ClampedArray(rgba);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    TPP.throwIfProgressCancelled(progressOp);
    gif.finish();
    const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
    const blob = new Blob([bytes], { type: "image/gif" });
    const name = TPP.exportFileName(settings, {
      extension: "gif",
      kind: "pages-animated",
    });
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "Animated GIF complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "Animated GIF export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
TPP.exportMp4 = async function (options) {
  const progressOp = TPP.beginProgressOperation("MP4 export");
  try {
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
  const scale = TPP.imageExportRenderScale(settings, exportOptions);
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const renderShell = TPP.createExportRenderShell(settings);
    mount.appendChild(renderShell);
    const probeCanvas = TPP.fitCanvasToExportTarget(
      await TPP.renderExportPageCanvas(
      renderShell,
      pages[0],
      settings,
      scale,
      ),
      exportOptions,
    );
    const firstCanvas = await TPP.exportCanvasForDepth(
      probeCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
      exportOptions,
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
      languageCode: await TPP.mp4LanguageCode(settings),
      maximumPacketCount: pages.length,
      hasOnlyKeyPackets: false,
    });
    const metadataTags = TPP.mp4MetadataTags(settings);
    if (Object.keys(metadataTags).length) output.setMetadataTags(metadataTags);
    await output.start();
    let timestamp = 0;
    const duration = Math.max(0.01, exportOptions.frameDelay / 1000);
    for (let i = 0; i < pages.length; i++) {
      TPP.throwIfProgressCancelled(progressOp);
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
              TPP.throwIfProgressCancelled(progressOp);
              return TPP.opaqueCanvas(
                await TPP.exportCanvasForDepth(
                  TPP.fitCanvasToExportTarget(canvas, exportOptions),
                  exportOptions.colorDepth,
                  exportOptions.threshold,
                  exportOptions.palette,
                  exportOptions,
                ),
                "#ffffff",
              );
            })();
      TPP.showProgress(
        5 + Math.round(((i + 0.5) / pages.length) * 80),
        "Rendered MP4 frame " + (i + 1) + " of " + pages.length + "...",
        { previewCanvas: pageCanvas },
      );
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
    TPP.throwIfProgressCancelled(progressOp);
    videoSource.close();
    await output.finalize();
    TPP.throwIfProgressCancelled(progressOp);
    if (!target.buffer) {
      throw new Error("MP4 export completed without a downloadable buffer.");
    }
    const blob = new Blob([target.buffer], { type: "video/mp4" });
    const name = TPP.exportFileName(settings, {
      extension: "mp4",
      kind: "pages",
      qualifiers: ["video"],
    });
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.finishProgressOperation(progressOp);
  TPP.showProgress(100, "MP4 complete");
  } catch (error) {
    if (TPP.isProgressCancelledError(error)) {
      TPP.finishProgressOperation(progressOp, {
        cancelled: true,
        message: "MP4 export canceled.",
      });
      return;
    }
    TPP.finishProgressOperation(progressOp);
    throw error;
  }
};
