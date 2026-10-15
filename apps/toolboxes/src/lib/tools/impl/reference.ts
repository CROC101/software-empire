/// ข้อมูลอ้างอิง (ตารางคงที่จากมาตรฐานเปิด — RFC 9110, IANA)

export const HTTP_STATUS: [number, string, string][] = [
  [100, "Continue", "เซิร์ฟเวอร์ได้รับ header แล้ว ส่ง body ต่อได้"],
  [101, "Switching Protocols", "เปลี่ยนโปรโตคอล เช่น อัปเกรดเป็น WebSocket"],
  [103, "Early Hints", "ให้เบราว์เซอร์โหลดทรัพยากรล่วงหน้าระหว่างรอคำตอบจริง"],
  [200, "OK", "สำเร็จ"],
  [201, "Created", "สร้างข้อมูลใหม่สำเร็จ (มักตอบหลัง POST)"],
  [202, "Accepted", "รับคำขอแล้ว แต่ยังประมวลผลไม่เสร็จ"],
  [204, "No Content", "สำเร็จ ไม่มีเนื้อหาตอบกลับ"],
  [206, "Partial Content", "ส่งข้อมูลบางส่วนตาม Range (เช่น วิดีโอ)"],
  [301, "Moved Permanently", "ย้ายถาวร — search engine โอนคะแนนไป URL ใหม่"],
  [302, "Found", "ย้ายชั่วคราว"],
  [303, "See Other", "ให้ไปดูผลที่ URL อื่นด้วย GET (หลังส่งฟอร์ม)"],
  [304, "Not Modified", "ใช้ของใน cache ได้ ไม่ต้องโหลดใหม่"],
  [307, "Temporary Redirect", "ย้ายชั่วคราว คง method เดิม"],
  [308, "Permanent Redirect", "ย้ายถาวร คง method เดิม"],
  [400, "Bad Request", "คำขอผิดรูปแบบ / validation ไม่ผ่าน"],
  [401, "Unauthorized", "ยังไม่ได้ยืนยันตัวตน (ไม่ได้ล็อกอิน หรือ token หมดอายุ)"],
  [403, "Forbidden", "ยืนยันตัวตนแล้วแต่ไม่มีสิทธิ์"],
  [404, "Not Found", "ไม่พบทรัพยากร"],
  [405, "Method Not Allowed", "path นี้ไม่รับ method นี้"],
  [406, "Not Acceptable", "ตอบในรูปแบบที่ Accept ขอไม่ได้"],
  [408, "Request Timeout", "ไคลเอนต์ส่งคำขอช้าเกินไป"],
  [409, "Conflict", "ขัดกับสถานะปัจจุบัน เช่น ข้อมูลซ้ำ"],
  [410, "Gone", "ถูกลบถาวร"],
  [411, "Length Required", "ต้องมี Content-Length"],
  [412, "Precondition Failed", "เงื่อนไข If-Match ไม่ตรง"],
  [413, "Content Too Large", "ข้อมูลใหญ่เกินกำหนด"],
  [414, "URI Too Long", "URL ยาวเกินไป"],
  [415, "Unsupported Media Type", "ไม่รองรับ Content-Type นี้"],
  [418, "I'm a teapot", "มุกจาก RFC 2324 — ไม่ใช้งานจริง"],
  [422, "Unprocessable Content", "รูปแบบถูกแต่ความหมายผิด"],
  [425, "Too Early", "ไม่ยอมประมวลผลคำขอที่อาจถูกเล่นซ้ำ"],
  [428, "Precondition Required", "ต้องมีเงื่อนไข (If-Match) กันเขียนทับ"],
  [429, "Too Many Requests", "ส่งถี่เกินไป — ดู header Retry-After"],
  [431, "Request Header Fields Too Large", "header ใหญ่เกินไป (มักเป็นคุกกี้)"],
  [451, "Unavailable For Legal Reasons", "ถูกปิดกั้นด้วยเหตุทางกฎหมาย"],
  [500, "Internal Server Error", "เซิร์ฟเวอร์ผิดพลาด"],
  [501, "Not Implemented", "เซิร์ฟเวอร์ไม่รองรับความสามารถนี้"],
  [502, "Bad Gateway", "gateway/proxy ได้คำตอบผิดจากต้นทาง"],
  [503, "Service Unavailable", "ปิดปรับปรุงหรือรับโหลดไม่ไหว — ดู Retry-After"],
  [504, "Gateway Timeout", "ต้นทางตอบช้าเกินไป"],
  [505, "HTTP Version Not Supported", "ไม่รองรับเวอร์ชัน HTTP นี้"],
];

export const MIME_TYPES: [string, string][] = [
  ["html", "text/html"],
  ["htm", "text/html"],
  ["css", "text/css"],
  ["js", "text/javascript"],
  ["mjs", "text/javascript"],
  ["json", "application/json"],
  ["xml", "application/xml"],
  ["txt", "text/plain"],
  ["csv", "text/csv"],
  ["md", "text/markdown"],
  ["ics", "text/calendar"],
  ["yaml", "application/yaml"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["gif", "image/gif"],
  ["webp", "image/webp"],
  ["avif", "image/avif"],
  ["svg", "image/svg+xml"],
  ["ico", "image/vnd.microsoft.icon"],
  ["bmp", "image/bmp"],
  ["tif", "image/tiff"],
  ["heic", "image/heic"],
  ["mp3", "audio/mpeg"],
  ["wav", "audio/wav"],
  ["ogg", "audio/ogg"],
  ["m4a", "audio/mp4"],
  ["flac", "audio/flac"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"],
  ["mov", "video/quicktime"],
  ["mkv", "video/x-matroska"],
  ["avi", "video/x-msvideo"],
  ["pdf", "application/pdf"],
  ["zip", "application/zip"],
  ["gz", "application/gzip"],
  ["tar", "application/x-tar"],
  ["7z", "application/x-7z-compressed"],
  ["rar", "application/vnd.rar"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["xls", "application/vnd.ms-excel"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["ppt", "application/vnd.ms-powerpoint"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["odt", "application/vnd.oasis.opendocument.text"],
  ["epub", "application/epub+zip"],
  ["rtf", "application/rtf"],
  ["woff", "font/woff"],
  ["woff2", "font/woff2"],
  ["ttf", "font/ttf"],
  ["otf", "font/otf"],
  ["wasm", "application/wasm"],
  ["bin", "application/octet-stream"],
  ["exe", "application/vnd.microsoft.portable-executable"],
  ["apk", "application/vnd.android.package-archive"],
];

/// แยก User-Agent แบบหยาบ (UA เป็นข้อความที่ปลอมได้ ใช้ประกอบเท่านั้น)
export function parseUserAgent(ua: string) {
  const find = (re: RegExp) => re.exec(ua)?.[1]?.replace(/_/gu, ".");
  const browser =
    (find(/Edg(?:e|A|iOS)?\/([\d.]+)/u) &&
      `Microsoft Edge ${find(/Edg(?:e|A|iOS)?\/([\d.]+)/u)}`) ||
    (find(/OPR\/([\d.]+)/u) && `Opera ${find(/OPR\/([\d.]+)/u)}`) ||
    (find(/SamsungBrowser\/([\d.]+)/u) &&
      `Samsung Internet ${find(/SamsungBrowser\/([\d.]+)/u)}`) ||
    (find(/Line\/([\d.]+)/u) && `LINE in-app ${find(/Line\/([\d.]+)/u)}`) ||
    (find(/FBAV\/([\d.]+)/u) && `Facebook in-app ${find(/FBAV\/([\d.]+)/u)}`) ||
    (find(/(?:Firefox|FxiOS)\/([\d.]+)/u) && `Firefox ${find(/(?:Firefox|FxiOS)\/([\d.]+)/u)}`) ||
    (find(/(?:Chrome|CriOS)\/([\d.]+)/u) && `Chrome ${find(/(?:Chrome|CriOS)\/([\d.]+)/u)}`) ||
    (/Safari\//u.test(ua) &&
      find(/Version\/([\d.]+)/u) &&
      `Safari ${find(/Version\/([\d.]+)/u)}`) ||
    "ไม่ทราบ";
  const os =
    (find(/Windows NT ([\d.]+)/u) &&
      `Windows ${{ "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" }[find(/Windows NT ([\d.]+)/u) ?? ""] ?? find(/Windows NT ([\d.]+)/u)}`) ||
    (find(/Android ([\d.]+)/u) && `Android ${find(/Android ([\d.]+)/u)}`) ||
    (find(/(?:iPhone|CPU) OS ([\d_]+)/u) &&
      `${/iPad/u.test(ua) ? "iPadOS" : "iOS"} ${find(/(?:iPhone|CPU) OS ([\d_]+)/u)}`) ||
    (find(/Mac OS X ([\d_.]+)/u) && `macOS ${find(/Mac OS X ([\d_.]+)/u)}`) ||
    (/CrOS/u.test(ua) && "ChromeOS") ||
    (/Linux/u.test(ua) && "Linux") ||
    "ไม่ทราบ";
  const device = /iPad|Tablet/u.test(ua)
    ? "แท็บเล็ต"
    : /Mobi|iPhone|Android/u.test(ua)
      ? "มือถือ"
      : /bot|crawler|spider|curl|wget/iu.test(ua)
        ? "บอท/สคริปต์"
        : "คอมพิวเตอร์";
  const engine =
    /Gecko\/\d/u.test(ua) && !/like Gecko/u.test(ua)
      ? "Gecko"
      : /AppleWebKit/u.test(ua)
        ? /Chrome|CriOS|Edg|OPR/u.test(ua)
          ? "Blink"
          : "WebKit"
        : "ไม่ทราบ";

  return { browser, os, device, engine, bot: /bot|crawler|spider/iu.test(ua) };
}

export const KEY_CODES = [
  "Enter",
  "Escape",
  "Tab",
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Space",
  "Shift",
  "Control",
  "Alt",
  "Meta",
];
