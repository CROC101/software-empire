const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;
const MAX_PAGES = 200;

type PdfObject = { id: number; body: string };
type Token =
  | { kind: "string"; value: Uint8Array }
  | { kind: "name" | "word" | "number"; value: string }
  | { kind: "array" | "end-array"; value: "" };

function bytesToBinary(bytes: Uint8Array) {
  let result = "";
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    result += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return result;
}

function binaryToBytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1)
    bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

function decodeHex(value: string) {
  const normalized = value.replace(/\s/g, "");
  const padded = normalized.length % 2 === 0 ? normalized : `${normalized}0`;
  return Uint8Array.from(padded.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
}

function decodeLiteral(value: string) {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== "\\") {
      bytes.push(value.charCodeAt(index) & 0xff);
      continue;
    }
    index += 1;
    const escaped = value[index];
    const simple: Record<string, number> = {
      n: 10,
      r: 13,
      t: 9,
      b: 8,
      f: 12,
      "(": 40,
      ")": 41,
      "\\": 92,
    };
    if (escaped in simple) bytes.push(simple[escaped]);
    else if (escaped === "\r" || escaped === "\n") {
      if (escaped === "\r" && value[index + 1] === "\n") index += 1;
    } else if (/[0-7]/.test(escaped ?? "")) {
      let octal = escaped;
      while (octal.length < 3 && /[0-7]/.test(value[index + 1] ?? "")) octal += value[++index];
      bytes.push(Number.parseInt(octal, 8) & 0xff);
    } else if (escaped !== undefined) bytes.push(escaped.charCodeAt(0) & 0xff);
  }
  return Uint8Array.from(bytes);
}

function tokenize(content: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < content.length) {
    const char = content[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "%") {
      while (index < content.length && content[index] !== "\n" && content[index] !== "\r")
        index += 1;
      continue;
    }
    if (char === "[") {
      tokens.push({ kind: "array", value: "" });
      index += 1;
      continue;
    }
    if (char === "]") {
      tokens.push({ kind: "end-array", value: "" });
      index += 1;
      continue;
    }
    if (char === "(") {
      index += 1;
      let depth = 1;
      let literal = "";
      while (index < content.length && depth > 0) {
        const next = content[index++];
        if (next === "\\" && index < content.length) literal += next + content[index++];
        else if (next === "(" && ++depth) literal += next;
        else if (next === ")") {
          depth -= 1;
          if (depth > 0) literal += next;
        } else literal += next;
      }
      tokens.push({ kind: "string", value: decodeLiteral(literal) });
      continue;
    }
    if (char === "<" && content[index + 1] !== "<") {
      const end = content.indexOf(">", index + 1);
      if (end < 0) break;
      tokens.push({ kind: "string", value: decodeHex(content.slice(index + 1, end)) });
      index = end + 1;
      continue;
    }
    if (char === "<" && content[index + 1] === "<") {
      const end = content.indexOf(">>", index + 2);
      index = end < 0 ? index + 2 : end + 2;
      continue;
    }
    if (char === "/") {
      const start = ++index;
      while (index < content.length && !/[\s()[\]<>/%]/.test(content[index])) index += 1;
      tokens.push({ kind: "name", value: content.slice(start, index) });
      continue;
    }
    const start = index;
    while (index < content.length && !/[\s()[\]<>/%]/.test(content[index])) index += 1;
    if (start === index) {
      index += 1;
      continue;
    }
    const value = content.slice(start, index);
    tokens.push({
      kind: /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[Ee][+-]?\d+)?$/.test(value) ? "number" : "word",
      value,
    });
  }
  return tokens;
}

function utf16HexToString(hex: string) {
  const units = hex.match(/.{4}/g) ?? [];
  return String.fromCharCode(...units.map((unit) => Number.parseInt(unit, 16)));
}

function parseCMap(value: string) {
  const map = new Map<string, string>();
  for (const section of value.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of section[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>/gi))
      map.set(pair[1].toUpperCase(), utf16HexToString(pair[2]));
  }
  for (const section of value.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const entry of section[1].matchAll(
      /<([\da-f]+)>\s*<([\da-f]+)>\s*(?:<([\da-f]+)>|\[([^\]]*)\])/gi,
    )) {
      const start = Number.parseInt(entry[1], 16);
      const end = Number.parseInt(entry[2], 16);
      const width = entry[1].length;
      if (end - start > 4096) continue;
      if (entry[3]) {
        const first = Number.parseInt(entry[3], 16);
        for (let code = start; code <= end; code += 1)
          map.set(
            code.toString(16).padStart(width, "0").toUpperCase(),
            String.fromCharCode(first + code - start),
          );
      } else if (entry[4]) {
        const destinations = [...entry[4].matchAll(/<([\da-f]+)>/gi)];
        for (let offset = 0; offset < destinations.length && start + offset <= end; offset += 1)
          map.set(
            (start + offset).toString(16).padStart(width, "0").toUpperCase(),
            utf16HexToString(destinations[offset][1]),
          );
      }
    }
  }
  return map;
}

function decodePdfText(bytes: Uint8Array, map: Map<string, string> | undefined) {
  if (!map?.size) {
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      const units: number[] = [];
      for (let index = 2; index + 1 < bytes.length; index += 2)
        units.push((bytes[index] << 8) | bytes[index + 1]);
      return String.fromCharCode(...units);
    }
    return new TextDecoder("windows-1252").decode(bytes);
  }
  const result: string[] = [];
  const widths = [...new Set([...map.keys()].map((key) => key.length))].sort((a, b) => b - a);
  for (let index = 0; index < bytes.length;) {
    let found = false;
    for (const width of widths) {
      const size = width / 2;
      if (index + size > bytes.length) continue;
      const key = [...bytes.subarray(index, index + size)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      const value = map.get(key);
      if (value !== undefined) {
        result.push(value);
        index += size;
        found = true;
        break;
      }
    }
    if (!found) {
      result.push("\uFFFD");
      index += 1;
    }
  }
  return result.join("");
}

async function extractStream(object: PdfObject): Promise<Uint8Array | null> {
  const marker = object.body.match(/\bstream\r?\n/);
  if (!marker || marker.index === undefined) return null;
  const start = marker.index + marker[0].length;
  let end = object.body.indexOf("endstream", start);
  if (end < 0) return null;
  if (object.body[end - 1] === "\n") end -= 1;
  if (object.body[end - 1] === "\r") end -= 1;
  const raw = binaryToBytes(object.body.slice(start, end));
  if (!/\/FlateDecode\b/.test(object.body.slice(0, marker.index))) return raw;
  if (typeof DecompressionStream === "undefined")
    throw new Error(
      "เบราว์เซอร์นี้ไม่รองรับการอ่าน PDF ที่บีบอัด กรุณาใช้ Chrome หรือ Edge รุ่นปัจจุบัน",
    );
  try {
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate"));
    const output = await new Response(stream).arrayBuffer();
    if (output.byteLength > MAX_UNCOMPRESSED_BYTES)
      throw new Error("ข้อมูลภายใน PDF ใหญ่เกินขนาดที่รองรับ");
    return new Uint8Array(output);
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes("ใหญ่เกิน")) throw cause;
    throw new Error("อ่านข้อมูล PDF ที่บีบอัดไม่ได้ ไฟล์อาจใช้รูปแบบที่ยังไม่รองรับ", { cause });
  }
}

function getRefs(value: string) {
  return [...value.matchAll(/(\d+)\s+\d+\s+R/g)].map((match) => Number(match[1]));
}

function parsePdfObjects(source: string) {
  const objects = new Map<number, PdfObject>();
  const objectOrder: number[] = [];
  const headerPattern = /(\d+)\s+\d+\s+obj\b/g;
  let cursor = 0;
  while (cursor < source.length) {
    headerPattern.lastIndex = cursor;
    const header = headerPattern.exec(source);
    if (!header) break;
    const id = Number(header[1]);
    const bodyStart = headerPattern.lastIndex;
    const endObjectBeforeStream = source.indexOf("endobj", bodyStart);
    const streamPattern = /\bstream\r?\n/g;
    streamPattern.lastIndex = bodyStart;
    const stream = streamPattern.exec(source);
    let endObjectIndex = endObjectBeforeStream;
    if (stream && (endObjectBeforeStream < 0 || stream.index < endObjectBeforeStream)) {
      const streamStart = streamPattern.lastIndex;
      const length = Number(source.slice(bodyStart, stream.index).match(/\/Length\s+(\d+)\b/)?.[1]);
      const objectEndSearchStart =
        Number.isInteger(length) && length >= 0
          ? streamStart + length
          : source.indexOf("endstream", streamStart);
      endObjectIndex =
        objectEndSearchStart >= 0 ? source.indexOf("endobj", objectEndSearchStart) : -1;
    }
    if (endObjectIndex < 0) break;
    objects.set(id, { id, body: source.slice(bodyStart, endObjectIndex) });
    objectOrder.push(id);
    cursor = endObjectIndex + "endobj".length;
  }
  return { objects, objectOrder };
}

function fontCMaps(
  resources: string,
  objects: Map<number, PdfObject>,
  cmapObjects: Map<number, Map<string, string>>,
) {
  const fonts = new Map<string, Map<string, string> | undefined>();
  const unsupported = new Set<string>();
  const fontDictionary = resources.match(/\/Font\s*<<([\s\S]*?)>>/)?.[1] ?? "";
  for (const entry of fontDictionary.matchAll(/\/([^\s/<>]+)\s+(\d+)\s+\d+\s+R/g)) {
    const font = objects.get(Number(entry[2]));
    const cmapId = Number(font?.body.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/)?.[1]);
    const cmap = cmapObjects.get(cmapId);
    fonts.set(entry[1], cmap);
    const hasUnicodeEncoding =
      /\/Encoding\s*\/(?:WinAnsiEncoding|MacRomanEncoding|StandardEncoding)\b/.test(
        font?.body ?? "",
      );
    const isSubsetFont = /\/BaseFont\s*\/[A-Z]{6}\+/.test(font?.body ?? "");
    if (
      !cmap?.size &&
      (/\/Subtype\s*\/Type0\b|\/Encoding\s*\/Identity-[HV]\b/.test(font?.body ?? "") ||
        (isSubsetFont && !hasUnicodeEncoding))
    )
      unsupported.add(entry[1]);
  }
  return { fonts, unsupported };
}

function extractText(
  content: string,
  fonts: Map<string, Map<string, string> | undefined>,
  unsupportedFonts: Set<string>,
) {
  const tokens = tokenize(content);
  const output: string[] = [];
  let activeFont: string | undefined;
  let lineHasText = false;
  let baselineY: number | undefined;
  let textX: number | undefined;
  let fontSize = 12;
  const pending: Token[] = [];
  const addText = (bytes: Uint8Array) => {
    const decoded = decodePdfText(bytes, activeFont ? fonts.get(activeFont) : undefined);
    output.push(decoded);
    if (textX !== undefined) textX += [...decoded].length * fontSize * 0.5;
    lineHasText = true;
  };
  const newLine = () => {
    if (lineHasText && output.at(-1) !== "\n") output.push("\n");
    lineHasText = false;
    baselineY = undefined;
    textX = undefined;
  };
  for (const token of tokens) {
    if (token.kind !== "word") {
      pending.push(token);
      continue;
    }
    const op = token.value;
    if (op === "Tf") {
      const name = [...pending].reverse().find((item) => item.kind === "name");
      const size = [...pending].reverse().find((item) => item.kind === "number");
      activeFont = name?.kind === "name" ? name.value : undefined;
      if (size?.kind === "number") fontSize = Math.abs(Number(size.value)) || fontSize;
      if (activeFont && unsupportedFonts.has(activeFont))
        throw new Error(
          "PDF นี้ใช้ฟอนต์ที่ไม่มี Unicode mapping จึงแปลงข้อความได้ไม่ถูกต้อง กรุณาส่งไฟล์ PDF ต้นฉบับเพื่อปรับการรองรับ",
        );
    } else if (op === "Tm") {
      const matrix = pending
        .filter((item) => item.kind === "number")
        .map((item) => Number(item.value));
      if (matrix.length >= 6) {
        const x = matrix[matrix.length - 2];
        const y = matrix[matrix.length - 1];
        if (
          lineHasText &&
          baselineY !== undefined &&
          Math.abs(y - baselineY) > Math.max(1.5, fontSize * 0.12)
        )
          newLine();
        else if (
          lineHasText &&
          textX !== undefined &&
          x - textX > Math.max(2.5, fontSize * 0.2) &&
          output.at(-1) !== " "
        )
          output.push(" ");
        baselineY = y;
        textX = x;
      }
    } else if (op === "Tj") {
      const text = [...pending].reverse().find((item) => item.kind === "string");
      if (text?.kind === "string") addText(text.value);
    } else if (op === "TJ") {
      const start = pending.map((item) => item.kind).lastIndexOf("array");
      for (const item of pending.slice(start + 1)) {
        if (item.kind === "string") addText(item.value);
        else if (item.kind === "number" && textX !== undefined)
          textX -= (Number(item.value) / 1000) * fontSize;
      }
    } else if (op === "T*") newLine();
    else if (op === "Td" || op === "TD") {
      const offsets = pending
        .filter((item) => item.kind === "number")
        .map((item) => Number(item.value));
      if (Math.abs(offsets.at(-1) ?? 0) > 0.5) newLine();
      else if (textX !== undefined) textX += offsets.at(-2) ?? 0;
    }
    pending.length = 0;
  }
  return output
    .join("")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(file: File) {
  if (file.size > MAX_PDF_BYTES) throw new Error("รองรับ PDF ขนาดไม่เกิน 25 MB");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = bytesToBinary(bytes.subarray(0, 8));
  if (!header.startsWith("%PDF-")) throw new Error("ไฟล์นี้ไม่มีรูปแบบ PDF ที่ถูกต้อง");
  const source = bytesToBinary(bytes);
  const { objects, objectOrder } = parsePdfObjects(source);
  if (!objects.size)
    throw new Error("อ่านโครงสร้าง PDF ไม่ได้ ไฟล์อาจใช้การบีบอัด object ที่ยังไม่รองรับ");

  const streams = new Map<number, Uint8Array>();
  let decodedBytes = 0;
  const loadStreams = async (ids: Set<number>) => {
    for (const id of ids) {
      if (streams.has(id)) continue;
      const object = objects.get(id);
      if (!object || !/\bstream\r?\n/.test(object.body)) continue;
      const stream = await extractStream(object);
      if (!stream) continue;
      decodedBytes += stream.byteLength;
      if (decodedBytes > MAX_UNCOMPRESSED_BYTES)
        throw new Error("ข้อมูลที่ต้องอ่านจาก PDF ใหญ่เกินขนาดที่รองรับ");
      streams.set(id, stream);
    }
  };
  const referencedStreams = () => {
    const ids = new Set<number>();
    for (const object of objects.values()) {
      if (/\/Type\s*\/ObjStm\b/.test(object.body)) ids.add(object.id);
      for (const key of ["Contents", "ToUnicode"]) {
        for (const match of object.body.matchAll(
          new RegExp(`/${key}\\s*(\\[[^\\]]*\\]|\\d+\\s+\\d+\\s+R)`, "g"),
        )) {
          for (const id of getRefs(match[1])) ids.add(id);
        }
      }
    }
    return ids;
  };
  await loadStreams(referencedStreams());

  for (const objectId of [...objectOrder]) {
    const object = objects.get(objectId);
    if (!object || !/\/Type\s*\/ObjStm\b/.test(object.body)) continue;
    const content = bytesToBinary(streams.get(objectId) ?? new Uint8Array());
    const count = Number(object.body.match(/\/N\s+(\d+)/)?.[1]);
    const first = Number(object.body.match(/\/First\s+(\d+)/)?.[1]);
    if (
      !content ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 100_000 ||
      !Number.isInteger(first) ||
      first < 0 ||
      first > content.length
    )
      continue;
    const header = [...content.slice(0, first).matchAll(/\d+/g)].map((match) => Number(match[0]));
    if (header.length < count * 2) continue;
    for (let index = 0; index < count; index += 1) {
      const id = header[index * 2];
      const start = first + header[index * 2 + 1];
      const end = index + 1 < count ? first + header[(index + 1) * 2 + 1] : content.length;
      if (
        !Number.isInteger(id) ||
        start < first ||
        end < start ||
        end > content.length ||
        objects.has(id)
      )
        continue;
      objects.set(id, { id, body: content.slice(start, end) });
      objectOrder.push(id);
    }
  }
  await loadStreams(referencedStreams());

  const cmapIds = new Set<number>();
  for (const object of objects.values()) {
    for (const match of object.body.matchAll(/\/ToUnicode\s+(\d+)\s+\d+\s+R/g))
      cmapIds.add(Number(match[1]));
  }
  const cmapObjects = new Map<number, Map<string, string>>();
  for (const [id, stream] of streams) {
    if (cmapIds.has(id)) cmapObjects.set(id, parseCMap(bytesToBinary(stream)));
  }

  const pageIds: number[] = [];
  const visitedPagesTree = new Set<number>();
  const visitPageTree = (id: number, depth: number) => {
    if (depth > 32 || visitedPagesTree.has(id)) return;
    visitedPagesTree.add(id);
    const body = objects.get(id)?.body;
    if (!body) return;
    if (/\/Type\s*\/Page\b/.test(body)) {
      pageIds.push(id);
      return;
    }
    if (/\/Type\s*\/Pages\b/.test(body)) {
      const kids = body.match(/\/Kids\s*\[([^\]]*)\]/)?.[1] ?? "";
      for (const childId of getRefs(kids)) visitPageTree(childId, depth + 1);
    }
  };
  const pagesRootId = Number(
    objects
      .get(objectOrder.find((id) => /\/Type\s*\/Catalog\b/.test(objects.get(id)?.body ?? "")) ?? -1)
      ?.body.match(/\/Pages\s+(\d+)\s+\d+\s+R/)?.[1],
  );
  if (pagesRootId) visitPageTree(pagesRootId, 0);
  if (!pageIds.length)
    pageIds.push(
      ...objectOrder.filter((id) => /\/Type\s*\/Page\b/.test(objects.get(id)?.body ?? "")),
    );
  if (!pageIds.length) throw new Error("ไม่พบหน้าหรือไม่มีข้อความใน PDF นี้");
  if (pageIds.length > MAX_PAGES) throw new Error(`รองรับ PDF ไม่เกิน ${MAX_PAGES} หน้า`);
  const pages: string[] = [];
  for (const pageId of pageIds) {
    const page = objects.get(pageId);
    if (!page) continue;
    let resources = page.body.match(/\/Resources\s*(<<[\s\S]*?>>|\d+\s+\d+\s+R)/)?.[1] ?? "";
    if (/^\d+/.test(resources)) resources = objects.get(Number.parseInt(resources, 10))?.body ?? "";
    if (!resources.includes("/Font")) {
      let parentId = Number(page.body.match(/\/Parent\s+(\d+)\s+\d+\s+R/)?.[1]);
      for (let depth = 0; parentId && depth < 8 && !resources.includes("/Font"); depth += 1) {
        const parent = objects.get(parentId);
        const inherited =
          parent?.body.match(/\/Resources\s*(<<[\s\S]*?>>|\d+\s+\d+\s+R)/)?.[1] ?? "";
        resources = /^\d+/.test(inherited)
          ? (objects.get(Number.parseInt(inherited, 10))?.body ?? "")
          : inherited;
        parentId = Number(parent?.body.match(/\/Parent\s+(\d+)\s+\d+\s+R/)?.[1]);
      }
    }
    const { fonts, unsupported } = fontCMaps(resources, objects, cmapObjects);
    const contentEntry = page.body.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/)?.[1] ?? "";
    const contentIds = getRefs(contentEntry);
    const pageText: string[] = [];
    for (const contentId of contentIds) {
      const stream = streams.get(contentId);
      if (stream) pageText.push(extractText(bytesToBinary(stream), fonts, unsupported));
    }
    pages.push(pageText.filter(Boolean).join("\n"));
  }
  const text = pages
    .map((page) => page.replace(/\n{3,}/g, "\n\n").trim())
    .filter(Boolean)
    .join("\n\n");
  if (!text)
    throw new Error(
      "ไม่พบข้อความที่เลือกคัดลอกได้ใน PDF นี้ อาจเป็น PDF สแกนภาพหรือใช้ฟอนต์ที่ไม่รองรับ",
    );
  if (text.includes("\uFFFD"))
    throw new Error(
      "PDF นี้มีอักขระที่อ่าน Unicode mapping ไม่ครบ จึงหยุดแปลงเพื่อป้องกันข้อความเพี้ยน",
    );
  if (text.length > 2_000_000) throw new Error("ข้อความหลังแปลงยาวเกินขนาดที่รองรับ");
  return { text, pages: pageIds.length };
}

function xmlEscape(value: string) {
  let valid = "";
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (
      codePoint === 0x9 ||
      codePoint === 0xa ||
      codePoint === 0xd ||
      (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
      (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
      (codePoint >= 0x10000 && codePoint <= 0x10ffff && (codePoint & 0xffff) < 0xfffe)
    )
      valid += char;
  }
  return valid
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function write16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}
function write32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}
function toArrayBuffer(bytes: Uint8Array) {
  return Uint8Array.from(bytes).buffer;
}

function createZip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50);
    write16(localView, 4, 20);
    write16(localView, 6, 0x0800);
    write16(localView, 8, 0);
    write16(localView, 10, 0);
    write16(localView, 12, 0x21);
    write32(localView, 14, crc);
    write32(localView, 18, data.length);
    write32(localView, 22, data.length);
    write16(localView, 26, name.length);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    locals.push(local);
    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50);
    write16(centralView, 4, 20);
    write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800);
    write16(centralView, 10, 0);
    write16(centralView, 12, 0);
    write16(centralView, 14, 0x21);
    write32(centralView, 16, crc);
    write32(centralView, 20, data.length);
    write32(centralView, 24, data.length);
    write16(centralView, 28, name.length);
    write32(centralView, 42, offset);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((total, item) => total + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50);
  write16(endView, 8, files.length);
  write16(endView, 10, files.length);
  write32(endView, 12, centralSize);
  write32(endView, 16, offset);
  return new Blob([...locals, ...centrals, end].map(toArrayBuffer), {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function createWordDocument(text: string, title: string) {
  const paragraphs = text
    .split(/\r?\n/)
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r></w:p>`)
    .join("");
  const safeTitle = xmlEscape(title);
  return createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${safeTitle}</dc:title></cp:coreProperties>`,
    },
    {
      name: "word/document.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`,
    },
  ]);
}

export function getWordFilename(filename: string) {
  const stem =
    filename
      .replace(/\.pdf$/i, "")
      // eslint-disable-next-line no-control-regex -- control characters are not allowed in file names
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .trim() || "converted-document";
  return `${stem}.docx`;
}
