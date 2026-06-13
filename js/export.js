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
  // Keep the block count in both legacy slot positions so common viewers
  // and emulators show the file size even if they parse raw directory slots differently.
  entry[28] = sectorCount & 0xff;
  entry[29] = (sectorCount >> 8) & 0xff;
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
TPP.d64CoverScaleCanvas = function (canvas, width, height) {
  if (!canvas || !canvas.width || !canvas.height) return null;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Number(width) || 320);
  out.height = Math.max(1, Number(height) || 200);
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};
TPP.d64CoverForcedGlyphPatterns = function () {
  const glyph = function (rows) {
    const mask = new Uint8Array(64);
    rows.forEach(function (row, y) {
      String(row || "").slice(0, 8).split("").forEach(function (char, x) {
        if (char !== " ") mask[y * 8 + x] = 1;
      });
    });
    return mask;
  };
  return {
    " ": glyph([
      "        ",
      "        ",
      "        ",
      "        ",
      "        ",
      "        ",
      "        ",
      "        ",
    ]),
    A: glyph([
      "  XXXX  ",
      " XX  XX ",
      " XX  XX ",
      " XXXXXX ",
      " XX  XX ",
      " XX  XX ",
      " XX  XX ",
      "        ",
    ]),
    C: glyph([
      "  XXXX  ",
      " XX  XX ",
      " XX     ",
      " XX     ",
      " XX     ",
      " XX  XX ",
      "  XXXX  ",
      "        ",
    ]),
    E: glyph([
      " XXXXXX ",
      " XX     ",
      " XX     ",
      " XXXXX  ",
      " XX     ",
      " XX     ",
      " XXXXXX ",
      "        ",
    ]),
    P: glyph([
      " XXXXX  ",
      " XX  XX ",
      " XX  XX ",
      " XXXXX  ",
      " XX     ",
      " XX     ",
      " XX     ",
      "        ",
    ]),
    R: glyph([
      " XXXXX  ",
      " XX  XX ",
      " XX  XX ",
      " XXXXX  ",
      " XX XX  ",
      " XX  XX ",
      " XX  XX ",
      "        ",
    ]),
    S: glyph([
      "  XXXX  ",
      " XX  XX ",
      " XX     ",
      "  XXXX  ",
      "     XX ",
      " XX  XX ",
      "  XXXX  ",
      "        ",
    ]),
  };
};
TPP.d64BitmapPromptGlyphs = function () {
  const glyph = function (rows, width) {
    const mask = new Uint8Array((width || 5) * 7);
    rows.forEach(function (row, y) {
      String(row || "").slice(0, width || 5).split("").forEach(function (char, x) {
        if (char !== " ") mask[y * (width || 5) + x] = 1;
      });
    });
    return mask;
  };
  return {
    " ": glyph([
      "     ",
      "     ",
      "     ",
      "     ",
      "     ",
      "     ",
      "     ",
    ]),
    A: glyph([
      " XXX ",
      "X   X",
      "X   X",
      "XXXXX",
      "X   X",
      "X   X",
      "X   X",
    ]),
    E: glyph([
      "XXXXX",
      "X    ",
      "X    ",
      "XXXX ",
      "X    ",
      "X    ",
      "XXXXX",
    ]),
    K: glyph([
      "X   X",
      "X  X ",
      "X X  ",
      "XX   ",
      "X X  ",
      "X  X ",
      "X   X",
    ]),
    N: glyph([
      "X   X",
      "XX  X",
      "XX  X",
      "X X X",
      "X  XX",
      "X  XX",
      "X   X",
    ]),
    P: glyph([
      "XXXX ",
      "X   X",
      "X   X",
      "XXXX ",
      "X    ",
      "X    ",
      "X    ",
    ]),
    R: glyph([
      "XXXX ",
      "X   X",
      "X   X",
      "XXXX ",
      "X X  ",
      "X  X ",
      "X   X",
    ]),
    S: glyph([
      " XXXX",
      "X    ",
      "X    ",
      " XXX ",
      "    X",
      "    X",
      "XXXX ",
    ]),
    Y: glyph([
      "X   X",
      "X   X",
      " X X ",
      "  X  ",
      "  X  ",
      "  X  ",
      "  X  ",
    ]),
  };
};
TPP.d64BitmapCoverLayout = function () {
  return {
    vicBankRegister: 0x02,
    bitmapAddress: 0x4000,
    screenAddress: 0x6000,
    spriteAddress: 0x6400,
    loadBufferAddress: 0x7000,
    d011: 0x3b,
    d016: 0x08,
    d018: 0x80,
    borderColor: 0x00,
    backgroundColor: 0x00,
  };
};
TPP.d64NearestPaletteIndex = function (r, g, b, palette) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.length; i += 1) {
    const swatch = palette[i];
    const dr = r - swatch[0];
    const dg = g - swatch[1];
    const db = b - swatch[2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
};
TPP.d64BuildBitmapPromptSprites = function () {
  const glyphs = TPP.d64BitmapPromptGlyphs();
  const message = "PRESS ANY KEY";
  const glyphWidth = 5;
  const glyphHeight = 7;
  const charSpacing = 1;
  const topPadding = 7;
  const totalWidth = message.length * glyphWidth + (message.length - 1) * charSpacing;
  const textMask = new Uint8Array(96 * 21);
  let cursorX = Math.floor((96 - totalWidth) / 2);
  for (let index = 0; index < message.length; index += 1) {
    const glyph = glyphs[message.charAt(index)] || glyphs[" "];
    for (let y = 0; y < glyphHeight; y += 1) {
      for (let x = 0; x < glyphWidth; x += 1) {
        if (!glyph[y * glyphWidth + x]) continue;
        const px = cursorX + x;
        const py = topPadding + y;
        if (px >= 0 && px < 96 && py >= 0 && py < 21) {
          textMask[py * 96 + px] = 1;
        }
      }
    }
    cursorX += glyphWidth + charSpacing;
  }
  const outlineMask = new Uint8Array(96 * 21);
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      if (textMask[y * 96 + x]) continue;
      let touchesText = false;
      for (let dy = -1; dy <= 1 && !touchesText; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= 96 || ny < 0 || ny >= 21) continue;
          if (textMask[ny * 96 + nx]) {
            touchesText = true;
            break;
          }
        }
      }
      if (touchesText) outlineMask[y * 96 + x] = 1;
    }
  }
  let minX = 96;
  let maxX = -1;
  for (let y = 0; y < 21; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      if (!outlineMask[y * 96 + x] && !textMask[y * 96 + x]) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  if (maxX >= minX) {
    const visibleWidth = maxX - minX + 1;
    const targetLeft = Math.floor((96 - visibleWidth) / 2);
    const shiftX = targetLeft - minX;
    if (shiftX !== 0) {
      const shiftMask = function (mask) {
        const shifted = new Uint8Array(mask.length);
        for (let y = 0; y < 21; y += 1) {
          for (let x = 0; x < 96; x += 1) {
            if (!mask[y * 96 + x]) continue;
            const nextX = x + shiftX;
            if (nextX < 0 || nextX >= 96) continue;
            shifted[y * 96 + nextX] = mask[y * 96 + x];
          }
        }
        return shifted;
      };
      const shiftedOutline = shiftMask(outlineMask);
      const shiftedText = shiftMask(textMask);
      outlineMask.set(shiftedOutline);
      textMask.set(shiftedText);
    }
  }
  const sprites = [];
  [outlineMask, textMask].forEach(function (mask) {
    for (let spriteIndex = 0; spriteIndex < 4; spriteIndex += 1) {
      const sprite = new Uint8Array(64);
      const xStart = spriteIndex * 24;
      for (let row = 0; row < 21; row += 1) {
        for (let x = 0; x < 24; x += 1) {
          if (!mask[row * 96 + xStart + x]) continue;
          const byteIndex = row * 3 + (x >> 3);
          sprite[byteIndex] |= 0x80 >> (x & 7);
        }
      }
      sprites.push(sprite);
    }
  });
  return sprites;
};
TPP.buildD64PromptSpriteRecordBytes = function () {
  const spriteBlocks = TPP.d64BuildBitmapPromptSprites();
  const spriteBytes = new Uint8Array(spriteBlocks.length * 64);
  spriteBlocks.forEach(function (sprite, index) {
    spriteBytes.set(sprite, index * 64);
  });
  return spriteBytes;
};
TPP.buildD64PromptSpriteProgramBytes = function () {
  const layout = TPP.d64BitmapCoverLayout();
  const spriteBytes = TPP.buildD64PromptSpriteRecordBytes();
  const program = new Uint8Array(spriteBytes.length + 2);
  program[0] = layout.spriteAddress & 0xff;
  program[1] = (layout.spriteAddress >> 8) & 0xff;
  program.set(spriteBytes, 2);
  return program;
};
TPP.d64DatClassInfo = function (classId) {
  const catalog = {
    0: { size: 0, name: "" },
    1: { size: 1, name: "1.DAT" },
    2: { size: 2, name: "2.DAT" },
    3: { size: 4, name: "4.DAT" },
    4: { size: 8, name: "8.DAT" },
    5: { size: 16, name: "16.DAT" },
    6: { size: 32, name: "32.DAT" },
    7: { size: 64, name: "64.DAT" },
    8: { size: 128, name: "128.DAT" },
    9: { size: 256, name: "256.DAT" },
    10: { size: 512, name: "512.DAT" },
    11: { size: 1024, name: "1024.DAT" },
  };
  return catalog[classId] || null;
};
TPP.buildD64CoverRecordBytes = function (coverLayout) {
  if (!coverLayout || !coverLayout.bitmap || !coverLayout.screen) return null;
  const layout = TPP.d64BitmapCoverLayout();
  const spritePointerBase = (layout.spriteAddress - (layout.bitmapAddress & 0xc000)) >> 6;
  const screenBytes = new Uint8Array(1024);
  screenBytes.set(coverLayout.screen, 0);
  screenBytes[0x03f8] = spritePointerBase + 0;
  screenBytes[0x03f9] = spritePointerBase + 1;
  screenBytes[0x03fa] = spritePointerBase + 2;
  screenBytes[0x03fb] = spritePointerBase + 3;
  screenBytes[0x03fc] = spritePointerBase + 4;
  screenBytes[0x03fd] = spritePointerBase + 5;
  screenBytes[0x03fe] = spritePointerBase + 6;
  screenBytes[0x03ff] = spritePointerBase + 7;
  const bytes = new Uint8Array(screenBytes.length + coverLayout.bitmap.length);
  bytes.set(screenBytes, 0);
  bytes.set(coverLayout.bitmap, screenBytes.length);
  return {
    backgroundIndex: 0,
    bytes: bytes,
  };
};
TPP.buildD64AssetBinBytes = function (segments, options) {
  const config = options || {};
  const assetSegments = Array.isArray(segments)
    ? segments.filter(function (segment) {
      return (
        segment &&
        Number.isFinite(segment.destination) &&
        segment.bytes &&
        typeof segment.bytes.length === "number" &&
        segment.bytes.length > 0
      );
    })
    : [];
  if (!assetSegments.length || assetSegments.length > 255) return null;
  let totalPayload = 0;
  let totalBytes = 4;
  assetSegments.forEach(function (segment) {
    totalPayload += segment.bytes.length;
    totalBytes += 5 + segment.bytes.length;
  });
  if (totalPayload > 0xffff || totalBytes > 0xffff) return null;
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  bytes[offset] = Math.max(0, Math.min(15, Number(config.backgroundIndex) || 0)) & 0x0f;
  offset += 1;
  bytes[offset] = assetSegments.length & 0xff;
  offset += 1;
  bytes[offset] = totalPayload & 0xff;
  offset += 1;
  bytes[offset] = (totalPayload >> 8) & 0xff;
  offset += 1;
  assetSegments.forEach(function (segment) {
    const destination = Number(segment.destination) & 0xffff;
    const length = segment.bytes.length & 0xffff;
    bytes[offset] = 0;
    bytes[offset + 1] = destination & 0xff;
    bytes[offset + 2] = (destination >> 8) & 0xff;
    bytes[offset + 3] = length & 0xff;
    bytes[offset + 4] = (length >> 8) & 0xff;
    offset += 5;
    bytes.set(segment.bytes, offset);
    offset += segment.bytes.length;
  });
  return bytes;
};
TPP.exportD64CoverData = async function (settings, options) {
  const pages = TPP.buildPages();
  const front = pages.find(function (page) {
    return page && page.role === "front";
  });
  if (!front) return null;
  const palette = TPP.imageExportNamedPalette("c64");
  if (!Array.isArray(palette) || !palette.length) return null;
  const mount = document.createElement("div");
  mount.style.cssText = "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const shell = document.createElement("div");
    shell.style.position = "relative";
    shell.style.width = settings.page.w + "in";
    shell.style.height = settings.page.h + "in";
    shell.style.background = "#fff";
    shell.appendChild(
      TPP.pageEl(front, settings, 0, 0, false, false, {
        w: settings.page.w,
        h: settings.page.h,
      }),
    );
    mount.appendChild(shell);
    TPP.renderQr(shell, settings);
    await TPP.waitForImages(shell);
    await new Promise(requestAnimationFrame);
    const rendered = await html2canvas(shell, TPP.html2canvasOptions({ scale: 1 }));
    const scaled = TPP.d64CoverScaleCanvas(rendered, 320, 200);
    if (!scaled) return null;
    const ctx = scaled.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const image = ctx.getImageData(0, 0, scaled.width, scaled.height);
    const pixels = image.data;
    const thresholdMap = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    const indexed = new Uint8Array(scaled.width * scaled.height);
    for (let y = 0; y < scaled.height; y += 1) {
      for (let x = 0; x < scaled.width; x += 1) {
        const offset = (y * scaled.width + x) * 4;
        const bias = (((thresholdMap[y & 3][x & 3] + 0.5) / 16) - 0.5) * 48;
        indexed[y * scaled.width + x] = TPP.d64NearestPaletteIndex(
          Math.max(0, Math.min(255, pixels[offset] + bias)),
          Math.max(0, Math.min(255, pixels[offset + 1] + bias)),
          Math.max(0, Math.min(255, pixels[offset + 2] + bias)),
          palette,
        );
      }
    }
    const paletteDistance = function (fromIndex, toIndex) {
      const from = palette[fromIndex] || palette[0];
      const to = palette[toIndex] || palette[0];
      const dr = from[0] - to[0];
      const dg = from[1] - to[1];
      const db = from[2] - to[2];
      return dr * dr + dg * dg + db * db;
    };
    const bitmap = new Uint8Array(8000);
    const screen = new Uint8Array(1000);
    for (let cellY = 0; cellY < 25; cellY += 1) {
      for (let cellX = 0; cellX < 40; cellX += 1) {
        const counts = new Uint16Array(16);
        const cellIndexes = new Uint8Array(64);
        let pixelCount = 0;
        for (let row = 0; row < 8; row += 1) {
          for (let col = 0; col < 8; col += 1) {
            const index = indexed[(cellY * 8 + row) * 320 + (cellX * 8 + col)];
            cellIndexes[pixelCount] = index;
            counts[index] += 1;
            pixelCount += 1;
          }
        }
        const used = [];
        for (let i = 0; i < 16; i += 1) {
          if (counts[i]) used.push(i);
        }
        let bestLo = used[0] || 0;
        let bestHi = used[0] || 0;
        let bestBits = new Uint8Array(64);
        let bestScore = Infinity;
        if (used.length === 1) {
          bestScore = 0;
        } else {
          for (let a = 0; a < used.length; a += 1) {
            for (let b = a + 1; b < used.length; b += 1) {
              const colorA = used[a];
              const colorB = used[b];
              let score = 0;
              let countA = 0;
              let countB = 0;
              const bits = new Uint8Array(64);
              for (let i = 0; i < 64; i += 1) {
                const source = cellIndexes[i];
                const distanceA = paletteDistance(source, colorA);
                const distanceB = paletteDistance(source, colorB);
                if (distanceB < distanceA) {
                  score += distanceB;
                  bits[i] = 1;
                  countB += 1;
                } else {
                  score += distanceA;
                  countA += 1;
                }
              }
              let lo = colorA;
              let hi = colorB;
              if (countB > countA) {
                lo = colorB;
                hi = colorA;
                for (let i = 0; i < 64; i += 1) bits[i] = bits[i] ? 0 : 1;
              }
              if (score < bestScore) {
                bestScore = score;
                bestLo = lo;
                bestHi = hi;
                bestBits = bits;
              }
            }
          }
        }
        const cellIndex = cellY * 40 + cellX;
        screen[cellIndex] = ((bestHi & 0x0f) << 4) | (bestLo & 0x0f);
        for (let row = 0; row < 8; row += 1) {
          let value = 0;
          for (let col = 0; col < 8; col += 1) {
            if (bestBits[row * 8 + col]) value |= 0x80 >> col;
          }
          bitmap[cellY * 320 + cellX * 8 + row] = value;
        }
      }
    }
    const coverLayout = {
      bitmap: bitmap,
      screen: screen,
    };
    if (!coverLayout) return null;
    return TPP.buildD64CoverRecordBytes(coverLayout);
  } finally {
    mount.remove();
  }
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
TPP.exportD64HomeRecords = function (book, options) {
  const settings = book || {};
  const config = options || {};
  const clean = function (value) {
    return String(value || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/"/g, "'")
      .trim()
      .toUpperCase();
  };
  const fieldValue = function (key, fallback, extra) {
    if (typeof TPP.bookInfoFieldValue === "function") {
      const value = TPP.bookInfoFieldValue(settings, key, extra);
      if (value) return clean(value);
    }
    if (typeof TPP.bookInfoValue === "function") {
      const value = TPP.bookInfoValue(settings, key);
      if (value) return clean(value);
    }
    if (settings && settings[key] != null && settings[key] !== "") return clean(settings[key]);
    return clean(fallback || "");
  };
  const records = [];
  const pushRecord = function (name, value, nameColor, valueColor) {
    const cleanName = clean(name);
    const cleanValue = clean(value);
    if (!cleanName || !cleanValue) return;
    records.push({
      name: cleanName.slice(0, 255),
      value: cleanValue.slice(0, 255),
      nameColor: Math.max(0, Math.min(15, Number(nameColor) || 0)),
      valueColor: Math.max(0, Math.min(15, Number(valueColor) || 0)),
    });
  };
  const totalPages = Math.max(1, Number(config.pageCount) || 1);
  const chapterCount = Array.isArray(settings.chapters)
    ? settings.chapters.filter(function (chapter) {
      return Boolean(chapter);
    }).length
    : 0;
  const pubDate = fieldValue("pubDate", "", { dateFormat: "year-month-day" });
  const pubYear = /^\d{4}/.test(pubDate) ? pubDate.slice(0, 4) : "";
  pushRecord("TITLE", fieldValue("title", "UNTITLED BOOK"), 3, 7);
  pushRecord("SUBTITLE", fieldValue("subtitle", ""), 3, 7);
  pushRecord("AUTHOR", fieldValue("author", (settings.by || settings.author || "UNKNOWN AUTHOR")), 14, 1);
  pushRecord("SERIES", fieldValue("series", ""), 13, 1);
  pushRecord("PUBLISHER", fieldValue("publisher", ""), 13, 1);
  pushRecord("YEAR", pubYear, 13, 1);
  pushRecord("PAGES", String(totalPages), 13, 1);
  pushRecord("CHAPTERS", String(chapterCount), 13, 1);
  pushRecord("CONTENTS", config.hasToc ? "AVAILABLE" : "NONE", 13, 1);
  return records;
};
TPP.exportD64IndexAndData = function (book, options) {
  const tocRecords = TPP.exportD64TocRecords(book);
  const homeRecords = TPP.exportD64HomeRecords(book, {
    pageCount: options && options.pageCount,
    hasToc: tocRecords.length > 0,
  });
  const config = options || {};
  const sections = [];
  const pushSection = function (tag, bytes) {
    if (!bytes.length) return;
    sections.push({
      tag: String(tag || "").slice(0, 3).toUpperCase(),
      classId: 5,
      bytes: bytes.slice(),
    });
  };
  homeRecords.forEach(function (record) {
    const nameBytes = Array.from(String(record.name || ""), function (char) {
      return char.charCodeAt(0) & 0xff;
    });
    const valueBytes = Array.from(String(record.value || ""), function (char) {
      return char.charCodeAt(0) & 0xff;
    });
    const homeBytes = [];
    homeBytes.push(((record.nameColor & 0x0f) << 4) | (record.valueColor & 0x0f));
    homeBytes.push(nameBytes.length & 0xff);
    homeBytes.push.apply(homeBytes, nameBytes);
    homeBytes.push(valueBytes.length & 0xff);
    homeBytes.push.apply(homeBytes, valueBytes);
    pushSection("HOM", homeBytes);
  });
  const tocBytes = [];
  tocRecords.forEach(function (record) {
    const titleBytes = Array.from(String(record.title || "").toUpperCase(), function (char) {
      return char.charCodeAt(0) & 0xff;
    });
    tocBytes.push(titleBytes.length & 0xff);
    tocBytes.push.apply(tocBytes, titleBytes);
    tocBytes.push(record.pointer & 0xff, (record.pointer >> 8) & 0xff);
  });
  pushSection("TOC", tocBytes);
  if (config.coverBytes && config.coverBytes.length) {
    sections.unshift({
      tag: "COV",
      classId: 10,
      bytes: config.coverBytes.slice(),
    });
  }
  if (config.promptBytes && config.promptBytes.length) {
    sections.push({
      tag: "ANK",
      classId: 7,
      bytes: config.promptBytes.slice(),
    });
  }
  const idxBytes = [];
  const datBuckets = {};
  const ensureBucket = function (classId) {
    if (!datBuckets[classId]) datBuckets[classId] = [];
    return datBuckets[classId];
  };
  const actualEntries = [];
  sections.forEach(function (section) {
    const info = TPP.d64DatClassInfo(section.classId);
    if (!info || !info.size) return;
    const bucket = ensureBucket(section.classId);
    const recordSize = info.size;
    const startRecord = Math.floor(bucket.length / recordSize);
    const paddedLength = Math.ceil(section.bytes.length / recordSize) * recordSize;
    const recordCount = paddedLength / recordSize;
    if (recordCount < 1 || recordCount > 256) {
      throw new Error("D64 section " + section.tag + " exceeds record capacity for " + info.name);
    }
    for (let i = 0; i < paddedLength; i += 1) {
      bucket.push(i < section.bytes.length ? section.bytes[i] : 0x00);
    }
    actualEntries.push({
      tag: section.tag,
      classId: section.classId,
      startRecord: startRecord,
      recordCount: recordCount === 256 ? 0x00 : recordCount & 0xff,
      nextRecord: 0,
    });
  });
  const tagOrder = [];
  const firstByTag = {};
  const lastByTag = {};
  actualEntries.forEach(function (entry, index) {
    if (!Object.prototype.hasOwnProperty.call(firstByTag, entry.tag)) {
      tagOrder.push(entry.tag);
      firstByTag[entry.tag] = index;
    }
    if (Object.prototype.hasOwnProperty.call(lastByTag, entry.tag)) {
      actualEntries[lastByTag[entry.tag]].nextRecord = index + 1;
    }
    lastByTag[entry.tag] = index;
  });
  const headEntries = tagOrder.map(function (tag) {
    return {
      tag: tag,
      classId: 0,
      startRecord: 0,
      recordCount: 0,
      nextRecord: 0,
    };
  });
  headEntries.push({
    tag: "TAG",
    classId: 0,
    startRecord: 0,
    recordCount: 0,
    nextRecord: 0,
  });
  const actualBaseRecord = headEntries.length + 1;
  actualEntries.forEach(function (entry, index) {
    if (entry.nextRecord) entry.nextRecord = actualBaseRecord + entry.nextRecord - 1;
  });
  headEntries.forEach(function (entry) {
    if (entry.tag === "TAG") return;
    entry.nextRecord = actualBaseRecord + firstByTag[entry.tag];
  });
  headEntries.concat(actualEntries).forEach(function (entry) {
    idxBytes.push(
      entry.tag.charCodeAt(0) & 0xff,
      entry.tag.charCodeAt(1) & 0xff,
      entry.tag.charCodeAt(2) & 0xff,
      entry.classId & 0xff,
      entry.startRecord & 0xff,
      (entry.startRecord >> 8) & 0xff,
      entry.recordCount & 0xff,
      entry.nextRecord & 0xff,
      (entry.nextRecord >> 8) & 0xff,
    );
  });
  const dataFiles = Object.keys(datBuckets)
    .map(function (classIdText) {
      const classId = Number(classIdText);
      const info = TPP.d64DatClassInfo(classId);
      return {
        name: info.name,
        classId: classId,
        data: new Uint8Array(datBuckets[classId]),
      };
    })
    .sort(function (a, b) {
      return a.classId - b.classId;
    });
  return {
    hasToc: tocRecords.length > 0,
    hasCover: Boolean(config.coverBytes && config.coverBytes.length),
    indexBytes: new Uint8Array(idxBytes),
    dataFiles: dataFiles,
    tocRecords: tocRecords,
    homeRecords: homeRecords,
  };
};
TPP.buildD64AssetLoaderProgramBytes = function () {
  const coverLayout = TPP.d64BitmapCoverLayout();
  const start = 0xc000;
  const configBase = 0xc900;
  const promptFallbackBytes = TPP.buildD64PromptSpriteRecordBytes();
  const vars = {
    status: configBase + 0,
    filenameLength: configBase + 1,
    filename: configBase + 2,
    fileOpen: configBase + 34,
    ptrLo: configBase + 35,
    ptrHi: configBase + 36,
    lenLo: configBase + 37,
    lenHi: configBase + 38,
    bandCount: configBase + 39,
    restoreFb: configBase + 40,
    restoreFc: configBase + 41,
    srcLo: configBase + 42,
    srcHi: configBase + 43,
    dstLo: configBase + 44,
    dstHi: configBase + 45,
    restoreFd: configBase + 46,
    restoreFe: configBase + 47,
    coverRecordLo: configBase + 48,
    coverRecordHi: configBase + 49,
    promptRecordLo: configBase + 50,
    promptRecordHi: configBase + 51,
    promptRecordCount: configBase + 52,
    skipLo: configBase + 53,
    skipHi: configBase + 54,
    readLenLo: configBase + 55,
    readLenHi: configBase + 56,
  };
  const promptFileName = "0:64.DAT,S,R";
  const coverFileName = "0:512.DAT,S,R";
  const KERNAL = {
    setnam: 0xffbd,
    setlfs: 0xffba,
    open: 0xffc0,
    close: 0xffc3,
    chkin: 0xffc6,
    clrchn: 0xffcc,
    chrin: 0xffcf,
    load: 0xffd5,
    scnkey: 0xff9f,
    getin: 0xffe4,
  };
  const promptFileNameBytes = Array.from(promptFileName, function (char) {
    return char.charCodeAt(0) & 0xff;
  });
  const coverFileNameBytes = Array.from(coverFileName, function (char) {
    return char.charCodeAt(0) & 0xff;
  });
  const code = [];
  const labels = {};
  const fixups = [];
  const emit = function () {
    for (let i = 0; i < arguments.length; i += 1) code.push(arguments[i] & 0xff);
  };
  const label = function (name) {
    labels[name] = start + code.length;
  };
  const absoluteFixup = function (name) {
    fixups.push({ kind: "abs", index: code.length, name: name });
    emit(0x00, 0x00);
  };
  const relativeFixup = function (name) {
    fixups.push({ kind: "rel", index: code.length, name: name });
    emit(0x00);
  };
  const ldaImm = function (value) { emit(0xa9, value); };
  const ldxImm = function (value) { emit(0xa2, value); };
  const ldyImm = function (value) { emit(0xa0, value); };
  const ldaAbs = function (value) { emit(0xad, value & 0xff, (value >> 8) & 0xff); };
  const staAbs = function (value) { emit(0x8d, value & 0xff, (value >> 8) & 0xff); };
  const incAbs = function (value) { emit(0xee, value & 0xff, (value >> 8) & 0xff); };
  const decAbs = function (value) { emit(0xce, value & 0xff, (value >> 8) & 0xff); };
  const jsrAbs = function (value) { emit(0x20, value & 0xff, (value >> 8) & 0xff); };
  const jsrLabel = function (name) { emit(0x20); absoluteFixup(name); };
  const jmpLabel = function (name) { emit(0x4c); absoluteFixup(name); };
  const bne = function (name) { emit(0xd0); relativeFixup(name); };
  const bcc = function (name) { emit(0x90); relativeFixup(name); };
  const bcs = function (name) { emit(0xb0); relativeFixup(name); };
  const beq = function (name) { emit(0xf0); relativeFixup(name); };
  const ldaLabelLo = function (name) {
    emit(0xa9);
    fixups.push({ kind: "lo", index: code.length, name: name });
    emit(0x00);
  };
  const ldaLabelHi = function (name) {
    emit(0xa9);
    fixups.push({ kind: "hi", index: code.length, name: name });
    emit(0x00);
  };
  const andImm = function (value) { emit(0x29, value); };
  const oraImm = function (value) { emit(0x09, value); };
  const cmpAbs = function (value) { emit(0xcd, value & 0xff, (value >> 8) & 0xff); };
  const sbcImm = function (value) { emit(0xe9, value); };
  const clc = function () { emit(0x18); };
  const sec = function () { emit(0x38); };
  const rts = function () { emit(0x60); };
  const dey = function () { emit(0x88); };
  const pha = function () { emit(0x48); };
  const pla = function () { emit(0x68); };
  const staIndY = function (zp) { emit(0x91, zp); };

  label("start");
  ldaImm(0x02);
  staAbs(vars.status);
  ldaImm(0x00);
  staAbs(vars.fileOpen);
  ldaAbs(0x00fb);
  staAbs(vars.restoreFb);
  ldaAbs(0x00fc);
  staAbs(vars.restoreFc);
  ldaAbs(0x00fd);
  staAbs(vars.restoreFd);
  ldaAbs(0x00fe);
  staAbs(vars.restoreFe);
  jsrLabel("clearKeys");
  jsrLabel("setCoverFilename");
  jsrLabel("openFile");
  bcc("openOk");
  jsrLabel("cleanup");
  rts();
  label("openOk");
  jsrLabel("skipCoverRecords");
  bcc("coverSkipOk");
  jsrLabel("cleanup");
  rts();
  label("coverSkipOk");
  ldaImm(coverLayout.screenAddress & 0xff);
  staAbs(vars.ptrLo);
  ldaImm((coverLayout.screenAddress >> 8) & 0xff);
  staAbs(vars.ptrHi);
  ldaImm(0x00);
  staAbs(vars.lenLo);
  ldaImm(0x04);
  staAbs(vars.lenHi);
  jsrLabel("streamSegment");
  bcc("screenOk");
  jsrLabel("cleanup");
  rts();
  label("screenOk");
  jsrLabel("hideSprites");
  ldaImm(coverLayout.borderColor);
  staAbs(0xd020);
  ldaImm(coverLayout.backgroundColor);
  staAbs(0xd021);
  ldaAbs(0xdd00);
  andImm(0xfc);
  oraImm(coverLayout.vicBankRegister);
  staAbs(0xdd00);
  ldaImm(coverLayout.d018);
  staAbs(0xd018);
  ldaImm(coverLayout.d016);
  staAbs(0xd016);
  ldaAbs(0xd011);
  oraImm(0x20);
  staAbs(0xd011);
  ldaImm(coverLayout.bitmapAddress & 0xff);
  staAbs(vars.ptrLo);
  ldaImm((coverLayout.bitmapAddress >> 8) & 0xff);
  staAbs(vars.ptrHi);
  ldaImm(0x40);
  staAbs(vars.lenLo);
  ldaImm(0x1f);
  staAbs(vars.lenHi);
  jsrLabel("zeroSegment");
  ldaImm(coverLayout.bitmapAddress & 0xff);
  staAbs(vars.dstLo);
  ldaImm((coverLayout.bitmapAddress >> 8) & 0xff);
  staAbs(vars.dstHi);
  ldaImm(25);
  staAbs(vars.bandCount);
  label("bandLoop");
  ldaImm(coverLayout.loadBufferAddress & 0xff);
  staAbs(vars.ptrLo);
  ldaImm((coverLayout.loadBufferAddress >> 8) & 0xff);
  staAbs(vars.ptrHi);
  ldaImm(0x40);
  staAbs(vars.lenLo);
  ldaImm(0x01);
  staAbs(vars.lenHi);
  jsrLabel("streamSegment");
  bcc("nextBand");
  jsrLabel("cleanup");
  rts();
  label("nextBand");
  ldaImm(coverLayout.loadBufferAddress & 0xff);
  staAbs(vars.srcLo);
  ldaImm((coverLayout.loadBufferAddress >> 8) & 0xff);
  staAbs(vars.srcHi);
  ldaImm(0x40);
  staAbs(vars.lenLo);
  ldaImm(0x01);
  staAbs(vars.lenHi);
  jsrLabel("copySegment");
  decAbs(vars.bandCount);
  bne("bandLoop");
  jsrLabel("cleanup");
  jsrLabel("hideSprites");
  jsrLabel("clearKeys");
  jsrLabel("delayPrompt");
  jsrLabel("loadFallbackPrompt");
  ldaAbs(vars.promptRecordCount);
  beq("coverReady");
  jsrLabel("setPromptFilename");
  jsrLabel("loadPromptFile");
  bcc("promptOpenOk");
  jmpLabel("coverReady");
  label("promptOpenOk");
  jsrLabel("hideSprites");
  label("coverReady");
  jsrLabel("showPrompt");
  jsrLabel("clearKeys");
  jsrLabel("waitForKey");
  ldaImm(0x00);
  staAbs(vars.status);
  rts();

  label("readRecordsEntry");
  ldaImm(0x02);
  staAbs(vars.status);
  ldaImm(0x00);
  staAbs(vars.fileOpen);
  ldaAbs(0x00fb);
  staAbs(vars.restoreFb);
  ldaAbs(0x00fc);
  staAbs(vars.restoreFc);
  ldaAbs(0x00fd);
  staAbs(vars.restoreFd);
  ldaAbs(0x00fe);
  staAbs(vars.restoreFe);
  jsrLabel("openFile");
  bcc("readerOpenOk");
  jsrLabel("cleanup");
  rts();
  label("readerOpenOk");
  ldaAbs(vars.skipLo);
  staAbs(vars.lenLo);
  ldaAbs(vars.skipHi);
  staAbs(vars.lenHi);
  jsrLabel("discardSegment");
  bcc("readerSkipOk");
  jsrLabel("cleanup");
  rts();
  label("readerSkipOk");
  ldaAbs(vars.dstLo);
  staAbs(vars.ptrLo);
  ldaAbs(vars.dstHi);
  staAbs(vars.ptrHi);
  ldaAbs(vars.readLenLo);
  staAbs(vars.lenLo);
  ldaAbs(vars.readLenHi);
  staAbs(vars.lenHi);
  jsrLabel("streamSegment");
  bcc("readerDoneOk");
  jsrLabel("cleanup");
  rts();
  label("readerDoneOk");
  jsrLabel("cleanup");
  ldaImm(0x00);
  staAbs(vars.status);
  rts();

  label("openFile");
  ldaAbs(vars.filenameLength);
  ldxImm(vars.filename & 0xff);
  ldyImm((vars.filename >> 8) & 0xff);
  jsrAbs(KERNAL.setnam);
  ldaImm(0x02);
  ldxImm(0x08);
  ldyImm(0x02);
  jsrAbs(KERNAL.setlfs);
  jsrAbs(KERNAL.open);
  bcc("openDone");
  staAbs(vars.status);
  sec();
  rts();
  label("openDone");
  ldaImm(0x01);
  staAbs(vars.fileOpen);
  ldxImm(0x02);
  jsrAbs(KERNAL.chkin);
  bcc("headerDone");
  ldaImm(0x03);
  staAbs(vars.status);
  sec();
  rts();
  label("headerDone");
  clc();
  rts();

  label("readByte");
  ldaImm(0x00);
  staAbs(0x0090);
  jsrAbs(KERNAL.chrin);
  pha();
  ldaAbs(0x0090);
  beq("readByteOk");
  andImm(64);
  bne("readByteOk");
  ldaAbs(0x0090);
  staAbs(vars.status);
  pla();
  sec();
  rts();
  label("readByteOk");
  pla();
  clc();
  rts();

  label("streamSegment");
  ldaAbs(vars.ptrLo);
  staAbs(0x00fb);
  ldaAbs(vars.ptrHi);
  staAbs(0x00fc);
  label("streamLoop");
  ldaAbs(vars.lenLo);
  oraImm(0x00);
  bne("streamByte");
  ldaAbs(vars.lenHi);
  beq("streamDone");
  label("streamByte");
  jsrLabel("readByte");
  bcc("haveByte");
  sec();
  rts();
  label("haveByte");
  ldyImm(0x00);
  staIndY(0xfb);
  incAbs(0x00fb);
  bne("streamPtrOk");
  incAbs(0x00fc);
  label("streamPtrOk");
  sec();
  ldaAbs(vars.lenLo);
  sbcImm(0x01);
  staAbs(vars.lenLo);
  ldaAbs(vars.lenHi);
  sbcImm(0x00);
  staAbs(vars.lenHi);
  jmpLabel("streamLoop");
  label("streamDone");
  ldaAbs(0x00fb);
  staAbs(vars.ptrLo);
  ldaAbs(0x00fc);
  staAbs(vars.ptrHi);
  clc();
  rts();

  label("copySegment");
  ldaAbs(vars.srcLo);
  staAbs(0x00fb);
  ldaAbs(vars.srcHi);
  staAbs(0x00fc);
  ldaAbs(vars.dstLo);
  staAbs(0x00fd);
  ldaAbs(vars.dstHi);
  staAbs(0x00fe);
  label("copyLoop");
  ldaAbs(vars.lenLo);
  oraImm(0x00);
  bne("copyByte");
  ldaAbs(vars.lenHi);
  beq("copyDone");
  label("copyByte");
  ldyImm(0x00);
  emit(0xb1, 0xfb);
  emit(0x91, 0xfd);
  incAbs(0x00fb);
  bne("copySrcOk");
  incAbs(0x00fc);
  label("copySrcOk");
  incAbs(0x00fd);
  bne("copyDstOk");
  incAbs(0x00fe);
  label("copyDstOk");
  sec();
  ldaAbs(vars.lenLo);
  sbcImm(0x01);
  staAbs(vars.lenLo);
  ldaAbs(vars.lenHi);
  sbcImm(0x00);
  staAbs(vars.lenHi);
  jmpLabel("copyLoop");
  label("copyDone");
  ldaAbs(0x00fd);
  staAbs(vars.dstLo);
  ldaAbs(0x00fe);
  staAbs(vars.dstHi);
  rts();

  label("zeroSegment");
  ldaAbs(vars.ptrLo);
  staAbs(0x00fb);
  ldaAbs(vars.ptrHi);
  staAbs(0x00fc);
  label("zeroLoop");
  ldaAbs(vars.lenLo);
  oraImm(0x00);
  bne("zeroByte");
  ldaAbs(vars.lenHi);
  beq("zeroDone");
  label("zeroByte");
  ldaImm(0x00);
  ldyImm(0x00);
  staIndY(0xfb);
  incAbs(0x00fb);
  bne("zeroPtrOk");
  incAbs(0x00fc);
  label("zeroPtrOk");
  sec();
  ldaAbs(vars.lenLo);
  sbcImm(0x01);
  staAbs(vars.lenLo);
  ldaAbs(vars.lenHi);
  sbcImm(0x00);
  staAbs(vars.lenHi);
  jmpLabel("zeroLoop");
  label("zeroDone");
  ldaAbs(0x00fb);
  staAbs(vars.ptrLo);
  ldaAbs(0x00fc);
  staAbs(vars.ptrHi);
  rts();

  label("scanKey");
  jsrAbs(KERNAL.scnkey);
  jsrAbs(KERNAL.getin);
  beq("noKey");
  sec();
  rts();
  label("noKey");
  clc();
  rts();

  label("waitForKey");
  label("waitForKeyRelease");
  jsrLabel("scanKey");
  bcs("waitForKeyRelease");
  label("waitForKeyLoop");
  jsrLabel("scanKey");
  bcc("waitForKeyLoop");
  jsrLabel("clearKeys");
  rts();

  label("clearKeys");
  ldaImm(0x00);
  staAbs(0x00c6);
  label("clearGetLoop");
  jsrAbs(KERNAL.getin);
  bne("clearGetLoop");
  rts();

  label("loadPromptFile");
  jsrLabel("setPromptFilename");
  jsrLabel("openFile");
  bcc("promptFileOpenOk");
  sec();
  rts();
  label("promptFileOpenOk");
  jsrLabel("skipPromptRecords");
  ldaImm(coverLayout.spriteAddress & 0xff);
  staAbs(vars.ptrLo);
  ldaImm((coverLayout.spriteAddress >> 8) & 0xff);
  staAbs(vars.ptrHi);
  ldaImm(0x00);
  staAbs(vars.lenLo);
  ldaImm(0x02);
  staAbs(vars.lenHi);
  jsrLabel("streamSegment");
  bcc("promptReadOk");
  jsrLabel("cleanup");
  sec();
  rts();
  label("promptReadOk");
  jsrLabel("cleanup");
  clc();
  rts();

  label("loadFallbackPrompt");
  ldaImm(promptFallbackBytes.length & 0xff);
  staAbs(vars.lenLo);
  ldaImm((promptFallbackBytes.length >> 8) & 0xff);
  staAbs(vars.lenHi);
  ldaImm(coverLayout.spriteAddress & 0xff);
  staAbs(vars.dstLo);
  ldaImm((coverLayout.spriteAddress >> 8) & 0xff);
  staAbs(vars.dstHi);
  ldaLabelLo("promptFallbackData");
  staAbs(vars.srcLo);
  ldaLabelHi("promptFallbackData");
  staAbs(vars.srcHi);
  jsrLabel("copySegment");
  rts();

  label("cleanup");
  jsrAbs(KERNAL.clrchn);
  ldaAbs(vars.fileOpen);
  beq("cleanupDone");
  ldaImm(0x02);
  jsrAbs(KERNAL.close);
  ldaImm(0x00);
  staAbs(vars.fileOpen);
  label("cleanupDone");
  ldaAbs(vars.restoreFb);
  staAbs(0x00fb);
  ldaAbs(vars.restoreFc);
  staAbs(0x00fc);
  ldaAbs(vars.restoreFd);
  staAbs(0x00fd);
  ldaAbs(vars.restoreFe);
  staAbs(0x00fe);
  rts();

  label("setPromptFilename");
  ldaImm(promptFileName.length);
  staAbs(vars.filenameLength);
  promptFileNameBytes.forEach(function (value, index) {
    ldaImm(value);
    staAbs(vars.filename + index);
  });
  rts();

  label("setCoverFilename");
  ldaImm(coverFileName.length);
  staAbs(vars.filenameLength);
  coverFileNameBytes.forEach(function (value, index) {
    ldaImm(value);
    staAbs(vars.filename + index);
  });
  rts();

  label("skipCoverRecords");
  ldaAbs(vars.coverRecordLo);
  staAbs(vars.skipLo);
  ldaAbs(vars.coverRecordHi);
  staAbs(vars.skipHi);
  label("skipCoverLoop");
  ldaAbs(vars.skipLo);
  oraImm(0x00);
  bne("skipCoverRecord");
  ldaAbs(vars.skipHi);
  beq("skipCoverDone");
  label("skipCoverRecord");
  ldaImm(0x00);
  staAbs(vars.lenLo);
  ldaImm(0x02);
  staAbs(vars.lenHi);
  jsrLabel("discardSegment");
  bcc("skipCoverStepOk");
  sec();
  rts();
  label("skipCoverStepOk");
  sec();
  ldaAbs(vars.skipLo);
  sbcImm(0x01);
  staAbs(vars.skipLo);
  ldaAbs(vars.skipHi);
  sbcImm(0x00);
  staAbs(vars.skipHi);
  jmpLabel("skipCoverLoop");
  label("skipCoverDone");
  rts();

  label("skipPromptRecords");
  ldaAbs(vars.promptRecordLo);
  staAbs(vars.skipLo);
  ldaAbs(vars.promptRecordHi);
  staAbs(vars.skipHi);
  label("skipPromptLoop");
  ldaAbs(vars.skipLo);
  oraImm(0x00);
  bne("skipPromptRecord");
  ldaAbs(vars.skipHi);
  beq("skipPromptDone");
  label("skipPromptRecord");
  ldaImm(0x40);
  staAbs(vars.lenLo);
  ldaImm(0x00);
  staAbs(vars.lenHi);
  jsrLabel("discardSegment");
  bcc("skipPromptStepOk");
  sec();
  rts();
  label("skipPromptStepOk");
  sec();
  ldaAbs(vars.skipLo);
  sbcImm(0x01);
  staAbs(vars.skipLo);
  ldaAbs(vars.skipHi);
  sbcImm(0x00);
  staAbs(vars.skipHi);
  jmpLabel("skipPromptLoop");
  label("skipPromptDone");
  rts();

  label("discardSegment");
  label("discardLoop");
  ldaAbs(vars.lenLo);
  oraImm(0x00);
  bne("discardByte");
  ldaAbs(vars.lenHi);
  beq("discardDone");
  label("discardByte");
  jsrLabel("readByte");
  bcc("discardHaveByte");
  sec();
  rts();
  label("discardHaveByte");
  sec();
  ldaAbs(vars.lenLo);
  sbcImm(0x01);
  staAbs(vars.lenLo);
  ldaAbs(vars.lenHi);
  sbcImm(0x00);
  staAbs(vars.lenHi);
  jmpLabel("discardLoop");
  label("discardDone");
  clc();
  rts();

  label("hideSprites");
  ldaImm(0x00);
  staAbs(0xd015);
  staAbs(0xd010);
  staAbs(0xd017);
  staAbs(0xd01d);
  staAbs(0xd01b);
  staAbs(0xd01c);
  staAbs(0xd000);
  staAbs(0xd002);
  staAbs(0xd004);
  staAbs(0xd006);
  staAbs(0xd008);
  staAbs(0xd00a);
  staAbs(0xd00c);
  staAbs(0xd00e);
  staAbs(0xd001);
  staAbs(0xd003);
  staAbs(0xd005);
  staAbs(0xd007);
  staAbs(0xd009);
  staAbs(0xd00b);
  staAbs(0xd00d);
  staAbs(0xd00f);
  rts();

  label("delayPrompt");
  ldyImm(180);
  label("delayFrame");
  ldaImm(0xff);
  label("waitHigh");
  cmpAbs(0xd012);
  bne("waitHigh");
  label("waitLow");
  cmpAbs(0xd012);
  beq("waitLow");
  dey();
  bne("delayFrame");
  rts();

  label("showPrompt");
  ldaImm(136);
  staAbs(0xd000);
  ldaImm(236);
  staAbs(0xd001);
  ldaImm(160);
  staAbs(0xd002);
  ldaImm(236);
  staAbs(0xd003);
  ldaImm(184);
  staAbs(0xd004);
  ldaImm(236);
  staAbs(0xd005);
  ldaImm(208);
  staAbs(0xd006);
  ldaImm(236);
  staAbs(0xd007);
  ldaImm(136);
  staAbs(0xd008);
  ldaImm(236);
  staAbs(0xd009);
  ldaImm(160);
  staAbs(0xd00a);
  ldaImm(236);
  staAbs(0xd00b);
  ldaImm(184);
  staAbs(0xd00c);
  ldaImm(236);
  staAbs(0xd00d);
  ldaImm(208);
  staAbs(0xd00e);
  ldaImm(236);
  staAbs(0xd00f);
  ldaImm(0x00);
  staAbs(0xd027);
  staAbs(0xd028);
  staAbs(0xd029);
  staAbs(0xd02a);
  ldaImm(0x01);
  staAbs(0xd02b);
  staAbs(0xd02c);
  staAbs(0xd02d);
  staAbs(0xd02e);
  ldaImm(0xff);
  staAbs(0xd015);
  rts();
  label("promptFallbackData");
  promptFallbackBytes.forEach(function (value) {
    emit(value);
  });
  fixups.forEach(function (fixup) {
    if (fixup.kind === "abs") {
      const target = labels[fixup.name];
      code[fixup.index] = target & 0xff;
      code[fixup.index + 1] = (target >> 8) & 0xff;
      return;
    }
    if (fixup.kind === "lo") {
      const target = labels[fixup.name];
      code[fixup.index] = target & 0xff;
      return;
    }
    if (fixup.kind === "hi") {
      const target = labels[fixup.name];
      code[fixup.index] = (target >> 8) & 0xff;
      return;
    }
    if (fixup.kind === "rel") {
      const target = labels[fixup.name];
      const from = start + fixup.index + 1;
      const delta = target - from;
      if (delta < -128 || delta > 127) {
        throw new Error("Out-of-range branch to " + fixup.name + " (" + String(delta) + ")");
      }
      code[fixup.index] = delta & 0xff;
    }
  });
  return {
    address: start,
    readerAddress: labels.readRecordsEntry,
    configBase: configBase,
    filenameLengthAddress: vars.filenameLength,
    statusAddress: vars.status,
    coverRecordAddress: vars.coverRecordLo,
    promptRecordAddress: vars.promptRecordLo,
    promptRecordCountAddress: vars.promptRecordCount,
    skipAddress: vars.skipLo,
    readLengthAddress: vars.readLenLo,
    destinationAddress: vars.dstLo,
    bytes: new Uint8Array(code),
  };
};
TPP.buildD64AssetLoaderProgramFile = function () {
  const loader = TPP.buildD64AssetLoaderProgramBytes();
  const fileBytes = new Uint8Array(loader.bytes.length + 2);
  fileBytes[0] = loader.address & 0xff;
  fileBytes[1] = (loader.address >> 8) & 0xff;
  fileBytes.set(loader.bytes, 2);
  return {
    address: loader.address,
    bytes: fileBytes,
  };
};
TPP.buildD64LoaderBootstrapBytes = function () {
  const address = 0xc800;
  const filename = "LOADER.PRG";
  const filenameBytes = Array.from(filename, function (char) {
    return char.charCodeAt(0) & 0xff;
  });
  const codeLength = 41;
  const filenameAddress = address + codeLength;
  const statusAddress = filenameAddress + filenameBytes.length + 1;
  const bytes = new Uint8Array([
    0xa9, filenameBytes.length & 0xff,
    0xa2, filenameAddress & 0xff,
    0xa0, (filenameAddress >> 8) & 0xff,
    0x20, 0xbd, 0xff,
    0xa9, 0x01,
    0xa2, 0x08,
    0xa0, 0x01,
    0x20, 0xba, 0xff,
    0xa9, 0x00,
    0xa2, 0x00,
    0xa0, 0x00,
    0x20, 0xd5, 0xff,
    0x90, 0x06,
    0xa9, 0x01,
    0x8d, statusAddress & 0xff, (statusAddress >> 8) & 0xff,
    0x60,
    0xa9, 0x00,
    0x8d, statusAddress & 0xff, (statusAddress >> 8) & 0xff,
    0x60,
    ...filenameBytes,
    0x00,
  ]);
  return {
    address: address,
    statusAddress: statusAddress,
    bytes: bytes,
  };
};
TPP.exportD64BootProgramBytes = function (book, pageCount, options) {
  const basicStart = 0x0801;
  const tokens = {
    END: 0x80,
    FOR: 0x81,
    NEXT: 0x82,
    DATA: 0x83,
    DIM: 0x86,
    READ: 0x87,
    GOTO: 0x89,
    RESTORE: 0x8c,
    GOSUB: 0x8d,
    RETURN: 0x8e,
    REM: 0x8f,
    STOP: 0x90,
    GOTO: 0x89,
    IF: 0x8b,
    CLR: 0x9c,
    LOAD: 0x93,
    "PRINT#": 0x98,
    POKE: 0x97,
    PRINT: 0x99,
    SYS: 0x9e,
    OPEN: 0x9f,
    CLOSE: 0xa0,
    GET: 0xa1,
    TO: 0xa4,
    THEN: 0xa7,
    AND: 0xaf,
    OR: 0xb0,
    INT: 0xb5,
    CHR$: 0xc7,
    PEEK: 0xc2,
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
  const hasCover = Boolean(config.hasCover);
  const loaderProgram = TPP.buildD64AssetLoaderProgramBytes();
  const loaderBootstrap = TPP.buildD64LoaderBootstrapBytes();
  const basicString = function (value) {
    return String(value || "")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/"/g, "'");
  };
  const bookInfoValue = function (key, fallback, options) {
    if (typeof TPP.bookInfoFieldValue === "function") {
      const value = TPP.bookInfoFieldValue(book, key, options);
      if (value) return basicString(value);
    }
    if (typeof TPP.bookInfoValue === "function") {
      const value = TPP.bookInfoValue(book, key);
      if (value) return basicString(value);
    }
    if (book && book[key] != null && book[key] !== "") return basicString(book[key]);
    return fallback || "";
  };
  const normalizeLineText = function (value) {
    return basicString(value).trim().toUpperCase();
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
  pushLine(5, 'CLR:DIM T$(200),N$(24),V$(24),NC(24),VC(24):RB=28672');
  pushLine(8, 'GOSUB 3000');
  if (hasCover) {
    pushLine(10, 'G$="COV":GOSUB 500:IF LN=0 THEN 20');
    pushLine(11, 'CR=TP:CD=DT:G$="ANK":GOSUB 500:AR=TP:AC=LN');
    pushLine(12, 'DT=CD:GOSUB 620:F$=DF$:GOSUB 3300:GOSUB 3330:GOSUB 3400');
  }
  pushLine(20, 'IF CV=1 THEN POKE 56576,SB:POKE 53272,SV:POKE 53265,S1:POKE 53270,S2:POKE 53269,SE:POKE 53280,6:POKE 53281,6:POKE 646,1:PRINT CHR$(147):CV=0');
  pushLine(25, 'POKE 53280,6:POKE 53281,6:POKE 646,1:PRINT CHR$(147)');
  pushLine(26, 'POKE 646,7:PRINT "TINY POCKETS PRESS"');
  pushLine(27, 'POKE 646,3:PRINT "BOOK FILE READER"');
  pushLine(28, 'PRINT');
  pushLine(29, 'POKE 646,1:PRINT "LOADING BOOK INFO..."');
  pushLine(30, 'GOSUB 200');
  pushLine(40, 'POKE 53280,6:POKE 53281,6:POKE 646,1:PRINT CHR$(147)');
  pushLine(50, 'POKE 646,7:PRINT "TINY POCKETS PRESS"');
  pushLine(60, 'PRINT');
  pushLine(70, 'FOR I=1 TO HC:GOSUB 1100:NEXT');
  pushLine(80, 'PRINT');
  pushLine(90, 'POKE 646,7');
  if (hasToc) pushLine(100, 'PRINT "PRESS T FOR CONTENTS"');
  pushLine(110, 'PRINT "PRESS Q TO QUIT"');
  pushLine(120, 'POKE 646,1');
  pushLine(130, 'PRINT "WAITING FOR COMMAND..."');
  pushLine(140, 'GET A$:IF A$="" THEN 140');
  pushLine(150, 'IF A$="Q" THEN 1900');
  if (hasToc) pushLine(160, 'IF A$="T" THEN 800');
  pushLine(170, 'GOTO 140');
  pushLine(200, 'IF HL=1 THEN RETURN');
  pushLine(210, 'HL=1:HC=0:G$="HOM":GOSUB 500');
  pushLine(220, 'IF LN=0 THEN RETURN');
  pushLine(230, 'IF HC>=24 THEN RETURN');
  pushLine(240, 'GOSUB 620');
  pushLine(250, 'RC=LN:IF RC<>0 THEN 254');
  pushLine(252, 'RC=256');
  pushLine(254, 'F$=DF$:SK=TP*RS:RL=RC*RS:GOSUB 7200');
  pushLine(256, 'IF RR<>0 THEN RETURN');
  pushLine(260, 'CB=PEEK(RB)');
  pushLine(270, 'HC=HC+1:NC(HC)=0:VC(HC)=CB');
  pushLine(272, 'IF VC(HC)<16 THEN 276');
  pushLine(274, 'VC(HC)=VC(HC)-16:NC(HC)=NC(HC)+1:GOTO 272');
  pushLine(276, 'NL=PEEK(RB+1):N$(HC)=""');
  pushLine(278, 'IF NL=0 THEN 286');
  pushLine(280, 'FOR J=0 TO NL-1:N$(HC)=N$(HC)+CHR$(PEEK(RB+2+J)):NEXT');
  pushLine(286, 'VL=PEEK(RB+2+NL):V$(HC)=""');
  pushLine(288, 'IF VL=0 THEN 296');
  pushLine(290, 'FOR J=0 TO VL-1:V$(HC)=V$(HC)+CHR$(PEEK(RB+3+NL+J)):NEXT');
  pushLine(296, 'I=HC:GOSUB 1100');
  pushLine(300, 'IF NX=0 THEN RETURN');
  pushLine(310, 'RI=NX:GOSUB 650');
  pushLine(320, 'IF LN=0 THEN RETURN');
  pushLine(330, 'GOTO 230');
  pushLine(500, 'TP=0:LN=0:DT=0:NX=0:RI=1');
  pushLine(510, 'GOSUB 650');
  pushLine(520, 'IF K$="TAG" THEN RETURN');
  pushLine(524, 'IF K$<>G$ THEN RI=RI+1:GOSUB 650:GOTO 520');
  pushLine(528, 'IF NX=0 THEN TP=0:LN=0:DT=0:RETURN');
  pushLine(530, 'RI=NX:GOSUB 650:RETURN');
  pushLine(650, 'TP=0:LN=0:DT=0:NX=0');
  pushLine(652, 'F$="BOOK.IDX,S,R":SK=(RI-1)*9:RL=9:GOSUB 7200');
  pushLine(654, 'IF RR<>0 THEN K$="TAG":RETURN');
  pushLine(656, 'K$=CHR$(PEEK(RB))+CHR$(PEEK(RB+1))+CHR$(PEEK(RB+2))');
  pushLine(658, 'DT=PEEK(RB+3)');
  pushLine(660, 'TP=PEEK(RB+4)+256*PEEK(RB+5)');
  pushLine(662, 'LN=PEEK(RB+6)');
  pushLine(664, 'NX=PEEK(RB+7)+256*PEEK(RB+8):RETURN');
  pushLine(620, 'RS=0:DF$=""');
  pushLine(622, 'IF DT=1 THEN RS=1:DF$="1.DAT":RETURN');
  pushLine(624, 'IF DT=2 THEN RS=2:DF$="2.DAT":RETURN');
  pushLine(626, 'IF DT=3 THEN RS=4:DF$="4.DAT":RETURN');
  pushLine(628, 'IF DT=4 THEN RS=8:DF$="8.DAT":RETURN');
  pushLine(630, 'IF DT=5 THEN RS=16:DF$="16.DAT":RETURN');
  pushLine(632, 'IF DT=6 THEN RS=32:DF$="32.DAT":RETURN');
  pushLine(634, 'IF DT=7 THEN RS=64:DF$="64.DAT":RETURN');
  pushLine(636, 'IF DT=8 THEN RS=128:DF$="128.DAT":RETURN');
  pushLine(638, 'IF DT=9 THEN RS=256:DF$="256.DAT":RETURN');
  pushLine(640, 'IF DT=10 THEN RS=512:DF$="512.DAT":RETURN');
  pushLine(642, 'IF DT=11 THEN RS=1024:DF$="1024.DAT"');
  pushLine(644, 'RETURN');
  if (hasToc) {
    pushLine(800, 'IF TL=1 THEN RETURN');
    pushLine(810, 'TL=1:TC=0:G$="TOC":GOSUB 500');
    pushLine(820, 'IF LN=0 THEN RETURN');
    pushLine(825, 'GOSUB 620');
    pushLine(830, 'OPEN 3,8,3,DF$');
    pushLine(832, 'RC=LN:IF RC<>0 THEN 836');
    pushLine(834, 'RC=256');
    pushLine(836, 'SK=TP*RS:IF SK<1 THEN 860');
    pushLine(850, 'FOR I=1 TO SK:GET#3,A$:NEXT');
    pushLine(860, 'RD=0:BY=RC*RS');
    pushLine(870, 'IF RD>=BY OR TC>=200 THEN CLOSE 3:RETURN');
    pushLine(880, 'GET#3,A$:IF ST<>0 THEN CLOSE 3:RETURN');
    pushLine(885, 'IF A$="" THEN LL=0:RD=RD+1:IF LL=0 THEN CLOSE 3:RETURN');
    pushLine(890, 'LL=ASC(A$):RD=RD+1:IF LL=0 THEN CLOSE 3:RETURN');
    pushLine(900, 'TC=TC+1:T$(TC)=""');
    pushLine(910, 'FOR J=1 TO LL:GET#3,A$:T$(TC)=T$(TC)+A$:NEXT');
    pushLine(920, 'RD=RD+LL');
    pushLine(930, 'GET#3,A$:GET#3,A$:RD=RD+2');
    pushLine(940, 'GOTO 870');
    pushLine(1200, 'POKE 53280,4:POKE 53281,4:POKE 646,7:PRINT CHR$(147)');
    pushLine(1210, 'PRINT "TABLE OF CONTENTS"');
    pushLine(1220, 'PRINT');
    pushLine(1230, 'POKE 646,1');
    pushLine(1240, 'S=PG*9+1:E=S+8:IF E>TC THEN E=TC');
    pushLine(1250, 'FOR I=S TO E:GOSUB 1400:NEXT');
    pushLine(1260, 'PRINT');
    pushLine(1270, 'F$="H/HOME"');
    pushLine(1275, 'IF PG>0 THEN F$="P/PREV "+F$');
    pushLine(1280, 'IF E<TC THEN F$=F$+" N/NEXT"');
    pushLine(1290, 'POKE 646,7:PRINT F$:POKE 646,1');
    pushLine(1295, 'RETURN');
    pushLine(1000, 'GET A$:IF A$="" THEN 1000');
    pushLine(1010, 'RETURN');
  }
  pushLine(1100, 'POKE 646,NC(I):PRINT N$(I);": ";:POKE 646,VC(I):PRINT V$(I):POKE 646,1:RETURN');
  if (hasToc) {
    pushLine(1400, 'X=I-S+1:P$=MID$(STR$(X),2)+". ":L$=T$(I)');
    pushLine(1410, 'LS=0');
    pushLine(1420, 'IF MID$(L$,LS+1,1)=" " THEN LS=LS+1:GOTO 1420');
    pushLine(1430, 'I$=""');
    pushLine(1440, 'FOR K=1 TO LEN(P$)+LS:I$=I$+" ":NEXT');
    pushLine(1450, 'W=40-LEN(P$)-LS');
    pushLine(1460, 'IF LEN(L$)<=W+LS THEN PRINT P$;L$:RETURN');
    pushLine(1470, 'B=W+LS');
    pushLine(1480, 'IF MID$(L$,B,1)<>" " AND B>LS+1 THEN B=B-1:GOTO 1480');
    pushLine(1490, 'IF B<=LS+1 THEN B=W+LS');
    pushLine(1500, 'PRINT P$;LEFT$(L$,B)');
    pushLine(1510, 'L$=MID$(L$,B+1)');
    pushLine(1520, 'P$=I$');
    pushLine(1530, 'W=40-LEN(P$)');
    pushLine(1540, 'IF LEN(L$)<=W THEN PRINT P$;L$:RETURN');
    pushLine(1550, 'B=W');
    pushLine(1560, 'IF MID$(L$,B,1)<>" " AND B>1 THEN B=B-1:GOTO 1560');
    pushLine(1570, 'IF B=1 THEN B=W');
    pushLine(1580, 'PRINT P$;LEFT$(L$,B)');
    pushLine(1590, 'L$=MID$(L$,B+1)');
    pushLine(1600, 'GOTO 1530');
  }
  if (loaderProgram) {
    pushLine(3000, 'IF ML=1 THEN RETURN');
    pushLine(3005, 'LT$="LOADING ENGINE":GOSUB 3500');
    pushLine(3010, 'RESTORE');
    pushLine(3020, 'BA=' + String(loaderBootstrap.address) + ':FOR I=0 TO ' + String(loaderBootstrap.bytes.length - 1) + ':READ B:POKE BA+I,B:NEXT');
    pushLine(3030, 'SYS ' + String(loaderBootstrap.address));
    pushLine(3040, 'IF PEEK(' + String(loaderBootstrap.statusAddress) + ')<>0 THEN POKE 646,2:PRINT:PRINT "ENGINE LOAD FAILED":POKE 646,1:END');
    pushLine(3050, 'ML=1:RETURN');
    pushLine(3290, 'IF LEN(F$)>32 THEN F$=LEFT$(F$,32)');
    pushLine(3300, 'POKE ' + String(loaderProgram.filenameLengthAddress) + ',LEN(F$)');
    pushLine(3310, 'FOR I=1 TO LEN(F$):POKE ' + String(loaderProgram.filenameLengthAddress + 1) + '+I-1,ASC(MID$(F$,I,1)):NEXT');
    pushLine(3312, 'POKE ' + String(loaderProgram.coverRecordAddress) + ',CR-256*INT(CR/256):POKE ' + String(loaderProgram.coverRecordAddress + 1) + ',INT(CR/256)');
    pushLine(3314, 'POKE ' + String(loaderProgram.promptRecordAddress) + ',AR-256*INT(AR/256):POKE ' + String(loaderProgram.promptRecordAddress + 1) + ',INT(AR/256)');
    pushLine(3316, 'POKE ' + String(loaderProgram.promptRecordCountAddress) + ',AC');
    pushLine(3320, 'RETURN');
    pushLine(7200, 'GOSUB 3300');
    pushLine(7210, 'POKE ' + String(loaderProgram.skipAddress) + ',SK-256*INT(SK/256):POKE ' + String(loaderProgram.skipAddress + 1) + ',INT(SK/256)');
    pushLine(7220, 'POKE ' + String(loaderProgram.readLengthAddress) + ',RL-256*INT(RL/256):POKE ' + String(loaderProgram.readLengthAddress + 1) + ',INT(RL/256)');
    pushLine(7230, 'POKE ' + String(loaderProgram.destinationAddress) + ',0:POKE ' + String(loaderProgram.destinationAddress + 1) + ',112');
    pushLine(7240, 'SYS ' + String(loaderProgram.readerAddress));
    pushLine(7250, 'RR=PEEK(' + String(loaderProgram.statusAddress) + '):RETURN');
    pushLine(3330, 'LT$="LOADING ":FOR J=1 TO LEN(F$):A$=MID$(F$,J,1):IF A$=":" THEN 3350');
    pushLine(3340, 'IF A$="." THEN 3360');
    pushLine(3342, 'LT$=LT$+A$:NEXT');
    pushLine(3350, 'LT$="LOADING ":NEXT');
    pushLine(3360, 'RETURN');
    pushLine(3400, 'SB=PEEK(56576):SV=PEEK(53272):S1=PEEK(53265):S2=PEEK(53270):SE=PEEK(53269):CV=0:GOSUB 3500');
    pushLine(3405, 'GET A$:IF A$<>"" THEN 3405');
    pushLine(3410, 'SYS ' + String(loaderProgram.address));
    pushLine(3420, 'LR=PEEK(' + String(loaderProgram.statusAddress) + '):IF LR=0 THEN 3430');
    pushLine(3422, 'IF LR=1 THEN POKE 56576,SB:POKE 53272,SV:POKE 53265,S1:POKE 53270,S2:POKE 53269,SE:RETURN');
    pushLine(3424, 'POKE 646,2:PRINT:PRINT "COVER LOAD FAILED";LR:POKE 646,1:RETURN');
    pushLine(3430, 'CV=1:RETURN');
    pushLine(3500, 'POKE 53280,6:POKE 53281,6:POKE 646,7:PRINT CHR$(147)');
    pushLine(3510, 'PRINT "        TINY POCKETS PRESS"');
    pushLine(3520, 'POKE 646,3:PRINT "          BOOK FILE READER"');
    pushLine(3530, 'POKE 646,1:PRINT');
    pushLine(3540, 'PRINT "   +--------------------------------+"');
    pushLine(3550, 'PRINT "   !                                !"');
    pushLine(3560, 'PRINT "   !   ";LT$');
    pushLine(3570, 'PRINT "   !                                !"');
    pushLine(3580, 'PRINT "   +--------------------------------+"');
    pushLine(3590, 'PRINT');
    pushLine(3600, 'IF LT$<>"LOADING ENGINE" THEN 3660');
    pushLine(3610, 'PRINT');
    pushLine(3620, 'PRINT');
    pushLine(3630, 'PRINT "           COMMODORE 64 EDITION"');
    pushLine(3640, 'PRINT "         MACHINE LANGUAGE BOOT"');
    pushLine(3650, 'PRINT');
    pushLine(3660, 'PRINT');
    pushLine(3670, 'PRINT "         IMAGE STREAM LOADING"');
    pushLine(3680, 'PRINT');
    pushLine(3690, 'PRINT "         PRESS ANY KEY TO SKIP"');
    pushLine(3700, 'PRINT');
    pushLine(3720, 'POKE 646,1:RETURN');
    let dataLine = 4200;
    for (let offset = 0; offset < loaderBootstrap.bytes.length; offset += 16) {
      const chunk = Array.from(loaderBootstrap.bytes.slice(offset, offset + 16));
      pushLine(dataLine, 'DATA ' + chunk.join(','));
      dataLine += 2;
    }
  }
  pushLine(1900, 'POKE 53280,2:POKE 53281,2:POKE 646,7:PRINT');
  pushLine(1910, 'PRINT "QUIT TO BASIC (Y/N)?"');
  pushLine(1920, 'GET A$:IF A$="" THEN 1920');
  pushLine(1930, 'IF A$="Y" THEN END');
  pushLine(1940, 'IF A$="N" THEN POKE 53280,6:POKE 53281,6:POKE 646,1:GOTO 20');
  pushLine(1950, 'GOTO 1920');
  const buffer = [];
  let address = basicStart;
  basicLines.sort(function (a, b) {
    return a.number - b.number;
  });
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
    await TPP.ensureImageExportPaletteForOptionsLoaded(
      Object.assign({}, options || {}, {
        palette: "c64",
      }),
    );
    TPP.sync();
    const settings = TPP.settings();
    const pages = TPP.buildPages();
    if (!pages.length) {
      alert("No pages available to export.");
      return;
    }
    TPP.showProgress(15, "Building Commodore 64 files...");
    const coverRecord = await TPP.exportD64CoverData(settings, options);
    const promptRecord = coverRecord && coverRecord.bytes && coverRecord.bytes.length
      ? TPP.buildD64PromptSpriteRecordBytes()
      : null;
    const loaderFile = TPP.buildD64AssetLoaderProgramFile();
    TPP.throwIfProgressCancelled(progressOp);
    TPP.showProgress(45, "Packing Commodore 64 data...");
    const bookFiles = TPP.exportD64IndexAndData(settings, {
      pageCount: pages.length,
      coverBytes: coverRecord && coverRecord.bytes ? coverRecord.bytes : null,
      promptBytes: promptRecord,
    });
    const d64Files = [
      {
        name: "BOOK.PRG",
        type: 0x82,
        data: TPP.exportD64BootProgramBytes(settings, pages.length, {
          hasToc: bookFiles.hasToc,
          hasCover: Boolean(bookFiles.hasCover),
        }),
      },
      {
        name: "BOOK.IDX",
        type: 0x81,
        data: bookFiles.indexBytes,
      },
      {
        name: "LOADER.PRG",
        type: 0x82,
        data: loaderFile.bytes,
      },
      ...bookFiles.dataFiles.map(function (file) {
        return {
          name: file.name,
          type: 0x81,
          data: file.data,
        };
      }),
      {
        name: "FILE_ID.DIZ",
        type: 0x81,
        data: new TextEncoder().encode(TPP.exportFileIdDizText(settings)),
      },
    ];
    TPP.throwIfProgressCancelled(progressOp);
    TPP.showProgress(75, "Building D64 disk image...");
    const imageBytes = TPP.buildD64Image(d64Files, settings);
    if (!imageBytes) {
      alert("Failed to build D64 disk image.");
      return;
    }
    const blob = new Blob([imageBytes], { type: "application/octet-stream" });
    TPP.downloadBlob(TPP.exportD64FileName(settings), blob);
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
