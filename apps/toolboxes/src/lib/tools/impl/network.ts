/// เครื่องมือเครือข่าย — คำนวณล้วน ไม่ส่งคำขอไปเครื่องไหน (ไม่มี DNS lookup / ping เพราะเสี่ยง SSRF และเป็นการเรียกภายนอก)

export function parseIPv4(text: string): number {
  const parts = text.trim().split(".");

  if (
    parts.length !== 4 ||
    parts.some(
      (p) => !/^\d{1,3}$/u.test(p) || Number(p) > 255 || (p.length > 1 && p.startsWith("0")),
    )
  )
    throw new Error(`"${text.trim()}" ไม่ใช่ IPv4 ที่ถูกต้อง`);

  return parts.reduce((acc, p) => acc * 256 + Number(p), 0);
}

export function formatIPv4(n: number): string {
  return [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join(".");
}

export function ipv4Class(n: number): string {
  const first = Math.floor(n / 2 ** 24);

  if (
    first === 10 ||
    (first === 172 && Math.floor(n / 2 ** 20) % 16 === 1) ||
    (first === 192 && Math.floor(n / 2 ** 16) % 256 === 168)
  )
    return "Private (RFC 1918)";
  if (first === 127) return "Loopback";
  if (first === 169 && Math.floor(n / 2 ** 16) % 256 === 254) return "Link-local";
  if (first === 100 && Math.floor(n / 2 ** 22) % 4 === 1) return "Carrier-grade NAT (RFC 6598)";
  if (first >= 224 && first <= 239) return "Multicast";
  if (first >= 240) return "Reserved";
  if (first === 0) return "This network";

  return "Public";
}

export function cidrInfo(text: string) {
  const [ipText, prefixText = "32"] = text.trim().split("/");
  const prefix = Number(prefixText);

  if (!/^\d{1,2}$/u.test(prefixText) || prefix > 32) throw new Error("prefix ต้องอยู่ระหว่าง 0–32");

  const ip = parseIPv4(ipText);
  const size = 2 ** (32 - prefix);
  const network = Math.floor(ip / size) * size;
  const broadcast = network + size - 1;
  const mask = 2 ** 32 - size;
  const usable = prefix >= 31 ? size : size - 2;

  return {
    network: formatIPv4(network),
    broadcast: formatIPv4(broadcast),
    mask: formatIPv4(mask),
    wildcard: formatIPv4(size - 1),
    first: formatIPv4(prefix >= 31 ? network : network + 1),
    last: formatIPv4(prefix >= 31 ? broadcast : broadcast - 1),
    total: size,
    usable,
    prefix,
    type: ipv4Class(ip),
    binaryMask: [24, 16, 8, 0]
      .map((s) => (Math.floor(mask / 2 ** s) % 256).toString(2).padStart(8, "0"))
      .join("."),
  };
}

export function maskToPrefix(mask: string): number {
  const n = parseIPv4(mask);
  const bits = n.toString(2).padStart(32, "0");

  if (!/^1*0*$/u.test(bits)) throw new Error("subnet mask ต้องเป็นเลข 1 ต่อเนื่องแล้วตามด้วย 0");

  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

export function ipInRange(ip: string, cidr: string): boolean {
  const info = cidrInfo(cidr);
  const n = parseIPv4(ip);

  return n >= parseIPv4(info.network) && n <= parseIPv4(info.broadcast);
}

/// IPv6 → รูปเต็ม 8 กลุ่ม (ขยาย ::) · รองรับ IPv4 ท้าย (::ffff:1.2.3.4)
export function expandIPv6(text: string): string[] {
  let input = text.trim().toLowerCase().replace(/%.*$/u, "");
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/u.exec(input);

  if (v4) {
    const n = parseIPv4(v4[1]);

    input = `${input.slice(0, v4.index)}${Math.floor(n / 65536).toString(16)}:${(n % 65536).toString(16)}`;
  }

  if ((input.match(/::/gu) ?? []).length > 1) throw new Error("IPv6 มี :: ได้แค่ครั้งเดียว");

  const [head, tail] = input.includes("::") ? input.split("::") : [input, null];
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;

  if ((tail === null && headParts.length !== 8) || missing < (tail === null ? 0 : 1))
    throw new Error("IPv6 ต้องมี 8 กลุ่ม");

  const groups = [
    ...headParts,
    ...Array<string>(tail === null ? 0 : missing).fill("0"),
    ...tailParts,
  ];

  if (groups.some((g) => !/^[0-9a-f]{1,4}$/u.test(g)))
    throw new Error("กลุ่มของ IPv6 ต้องเป็นเลขฐาน 16 ไม่เกิน 4 หลัก");

  return groups.map((g) => g.padStart(4, "0"));
}

/// รูปย่อตาม RFC 5952 (ตัด 0 นำหน้า · ย่อชุด 0 ที่ยาวที่สุด ≥ 2 กลุ่ม)
export function compressIPv6(groups: string[]): string {
  const short = groups.map((g) => g.replace(/^0+(?=.)/u, ""));
  let best = { start: -1, len: 0 };

  for (let i = 0; i < 8;) {
    if (short[i] !== "0") {
      i++;
      continue;
    }

    let j = i;

    while (j < 8 && short[j] === "0") j++;
    if (j - i > best.len) best = { start: i, len: j - i };
    i = j;
  }

  if (best.len < 2) return short.join(":");

  return `${short.slice(0, best.start).join(":")}::${short.slice(best.start + best.len).join(":")}`;
}

export function ipv6Type(groups: string[]): string {
  const first = parseInt(groups[0], 16);

  if (groups.every((g) => g === "0000")) return "Unspecified (::)";
  if (groups.slice(0, 7).every((g) => g === "0000") && groups[7] === "0001")
    return "Loopback (::1)";
  if (groups.slice(0, 5).every((g) => g === "0000") && groups[5] === "ffff") return "IPv4-mapped";
  if ((first & 0xffc0) === 0xfe80) return "Link-local";
  if ((first & 0xfe00) === 0xfc00) return "Unique local (ULA)";
  if ((first & 0xff00) === 0xff00) return "Multicast";
  if (groups[0] === "2001" && groups[1] === "0db8") return "Documentation (2001:db8::/32)";
  if ((first & 0xe000) === 0x2000) return "Global unicast";

  return "Reserved";
}

export function macInfo(text: string) {
  const hex = text
    .trim()
    .replace(/[:\-.\s]/gu, "")
    .toLowerCase();

  if (!/^[0-9a-f]{12}$/u.test(hex)) throw new Error("MAC address ต้องมีเลขฐาน 16 ทั้งหมด 12 หลัก");

  const pairs = hex.match(/../gu) ?? [];
  const first = parseInt(pairs[0] ?? "0", 16);

  return {
    colon: pairs.join(":"),
    hyphen: pairs.join("-").toUpperCase(),
    dot: hex.match(/..../gu)?.join(".") ?? "",
    unicast: (first & 1) === 0,
    local: (first & 2) === 2,
    oui: pairs.slice(0, 3).join(":").toUpperCase(),
  };
}
