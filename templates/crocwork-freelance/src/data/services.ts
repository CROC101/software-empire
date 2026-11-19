import type { BadgeKey, CategorySlug, Review, Service, ServicePackage } from '@/lib/types';

type Row = [
  id: string,
  title: string,
  category: CategorySlug,
  subcategory: string,
  sellerId: string,
  basePrice: number,
  basicDays: number,
  rating: number,
  reviewCount: number,
  sold: number,
  badges: BadgeKey[],
];

const rows: Row[] = [
  ['g1', 'ออกแบบโลโก้มินิมอล พร้อมไฟล์ AI/PNG แก้ไม่จำกัด', 'graphic-design', 'logo', 's1', 1500, 3, 5, 412, 1280, ['repeat', 'business']],
  ['g2', 'Logo Design for Startups – modern & memorable', 'graphic-design', 'logo', 's8', 2490, 3, 4.9, 188, 540, ['expert']],
  ['g3', 'ออกแบบแบนเนอร์โฆษณา Facebook / IG สะดุดตา', 'graphic-design', 'banner', 's1', 350, 1, 4.9, 965, 3200, ['repeat']],
  ['g4', 'ออกแบบฉลากสินค้าและกล่องบรรจุภัณฑ์ พร้อมส่งโรงพิมพ์', 'graphic-design', 'packaging', 's8', 3990, 7, 5, 76, 210, ['business', 'installment']],
  ['g5', 'วาดภาพประกอบสไตล์น่ารัก สำหรับแบรนด์และหนังสือ', 'graphic-design', 'illustration', 's8', 1200, 5, 4.8, 233, 610, ['repeat']],
  ['g6', 'ออกแบบ CI ครบชุด โลโก้ นามบัตร หัวจดหมาย', 'graphic-design', 'ci', 's1', 8900, 10, 5, 54, 130, ['pro', 'business']],
  ['w1', 'รับทำเว็บไซต์ธุรกิจ Responsive รองรับ SEO', 'web-programming', 'website', 's2', 6900, 7, 4.9, 302, 720, ['business', 'installment']],
  ['w2', 'WordPress Website + WooCommerce ร้านค้าออนไลน์', 'web-programming', 'wordpress', 's2', 9500, 14, 4.8, 141, 360, ['installment']],
  ['w3', 'พัฒนาแอปพลิเคชัน iOS / Android ด้วย Flutter', 'web-programming', 'mobile-app', 's9', 45000, 30, 5, 48, 92, ['pro', 'business', 'installment']],
  ['w4', 'ออกแบบ UX/UI แอปและเว็บไซต์ด้วย Figma', 'web-programming', 'ux-ui', 's9', 5500, 7, 4.9, 97, 240, ['expert']],
  ['w5', 'ทำ LINE OA Rich Menu + แชทบอทตอบอัตโนมัติ', 'web-programming', 'line-oa', 's2', 1990, 3, 4.9, 520, 1450, ['repeat']],
  ['w6', 'Python Automation & Web Scraping for your data', 'web-programming', 'data', 's9', 3500, 5, 4.7, 66, 150, []],
  ['m1', 'ยิงแอด Facebook & IG เพิ่มยอดขายจริง วัดผลได้', 'marketing', 'facebook-ads', 's3', 2900, 3, 4.9, 640, 2100, ['repeat', 'business']],
  ['m2', 'ทำ Google Ads Search + Display ตั้งค่าครบ', 'marketing', 'google-ads', 's3', 3900, 3, 4.8, 210, 600, ['business']],
  ['m3', 'ทำ SEO ติดหน้าแรก Google แบบ White Hat', 'marketing', 'seo', 's10', 5900, 30, 4.8, 180, 420, ['installment']],
  ['m4', 'แอดมินเพจ ตอบแชทลูกค้า 7 วัน/สัปดาห์', 'marketing', 'admin', 's3', 4500, 30, 4.9, 156, 390, ['repeat']],
  ['m5', 'TikTok Marketing วางแผนคอนเทนต์ + ไลฟ์', 'marketing', 'tiktok', 's5', 6500, 14, 5, 88, 205, ['expert']],
  ['m6', 'รีวิวสินค้าโดย Micro Influencer ตัวจริง', 'marketing', 'review', 's3', 990, 7, 4.7, 412, 1100, []],
  ['t1', 'เขียนบทความ SEO ภาษาไทย 1,000 คำ อ่านง่าย', 'writing-translation', 'article', 's4', 450, 2, 4.9, 820, 2600, ['repeat']],
  ['t2', 'Copywriting ขายของ แคปชันโดนใจ ปิดการขาย', 'writing-translation', 'copywriting', 's4', 690, 2, 4.8, 330, 980, []],
  ['t3', 'แปลเอกสาร ไทย ⇄ อังกฤษ โดยนักแปลมืออาชีพ', 'writing-translation', 'translate-en', 's4', 500, 1, 5, 1205, 4100, ['repeat', 'business']],
  ['t4', 'Chinese Translation – แปลจีนกลางทุกประเภท', 'writing-translation', 'translate-cn', 's4', 800, 2, 4.8, 145, 380, []],
  ['t5', 'พิสูจน์อักษรและเรียบเรียงภาษา วิทยานิพนธ์', 'writing-translation', 'proofreading', 's4', 350, 3, 4.9, 210, 520, ['expert']],
  ['v1', 'ตัดต่อวิดีโอ YouTube / TikTok สนุก ทันเทรนด์', 'video-audio', 'video-editing', 's5', 990, 2, 4.9, 735, 2300, ['repeat']],
  ['v2', 'Motion Graphic อธิบายสินค้า 60 วินาที', 'video-audio', 'motion', 's5', 7900, 10, 5, 122, 300, ['pro', 'business']],
  ['v3', 'พากย์เสียงโฆษณา สปอตวิทยุ เสียงหญิงนุ่มนวล', 'video-audio', 'voice-over', 's11', 800, 2, 5, 488, 1500, ['repeat']],
  ['v4', 'Professional Thai/English Voice Over', 'video-audio', 'voice-over', 's11', 1500, 3, 4.9, 160, 410, ['expert']],
  ['v5', 'ถ่ายภาพสินค้าสตูดิโอ พื้นขาว พร้อมรีทัช', 'video-audio', 'photography', 's5', 2500, 5, 4.8, 95, 260, []],
  ['b1', 'ทำบัญชีและยื่นภาษีรายเดือน สำหรับ SME', 'business-consulting', 'accounting', 's6', 2500, 30, 4.8, 120, 330, ['business']],
  ['b2', 'จดทะเบียนบริษัท ครบจบในที่เดียว', 'business-consulting', 'legal', 's12', 4900, 7, 5, 270, 800, ['pro', 'business']],
  ['b3', 'เขียนแผนธุรกิจสำหรับขอสินเชื่อและนักลงทุน', 'business-consulting', 'business-plan', 's6', 6900, 14, 4.7, 44, 110, ['installment']],
  ['b4', 'ร่างสัญญาจ้างและตรวจสัญญาโดยทนายความ', 'business-consulting', 'legal', 's12', 1500, 3, 4.9, 186, 500, ['expert']],
  ['l1', 'ดูดวงไพ่ยิปซี เจาะลึกการงาน การเงิน ความรัก', 'lifestyle', 'fortune', 's7', 199, 1, 4.9, 1530, 5200, ['repeat']],
  ['l2', 'จัดโปรแกรมออกกำลังกายและโภชนาการเฉพาะคุณ', 'lifestyle', 'fitness', 's7', 1290, 3, 4.8, 64, 150, []],
  ['l3', 'ติวภาษาอังกฤษออนไลน์ตัวต่อตัว เน้นพูดได้จริง', 'lifestyle', 'tutor', 's4', 600, 1, 5, 142, 400, ['expert']],
  ['l4', 'วางแผนทริปญี่ปุ่น พร้อมแผนที่และงบประมาณ', 'lifestyle', 'travel', 's7', 890, 3, 4.9, 58, 120, []],
];

const featureSets: Record<CategorySlug, string[]> = {
  'graphic-design': ['ไฟล์ต้นฉบับ', 'ไฟล์ความละเอียดสูง', 'ใช้เชิงพาณิชย์ได้', 'จำนวนแบบให้เลือก'],
  'web-programming': ['Responsive Design', 'ติดตั้งบนโฮสต์', 'ระบบหลังบ้าน', 'ดูแลหลังส่งงาน'],
  marketing: ['ตั้งค่าแคมเปญ', 'รายงานผลรายสัปดาห์', 'ทำครีเอทีฟ', 'ปรึกษาตลอดแคมเปญ'],
  'writing-translation': ['ตรวจทานก่อนส่ง', 'ปรับโทนตามแบรนด์', 'ส่งเป็นไฟล์ Word', 'รับรองคำแปล'],
  'video-audio': ['ไฟล์ Full HD', 'ใส่เพลงไม่ติดลิขสิทธิ์', 'ซับไตเติล', 'ไฟล์ต้นฉบับ'],
  'business-consulting': ['ปรึกษาออนไลน์', 'เอกสารครบชุด', 'ติดตามผล', 'ตอบคำถามหลังส่งงาน'],
  lifestyle: ['ปรึกษาออนไลน์', 'สรุปเป็นเอกสาร', 'ถามตอบเพิ่มเติม', 'นัดติดตามผล'],
};

function packagesFor(cat: CategorySlug, base: number, days: number): ServicePackage[] {
  const f = featureSets[cat];
  const round = (n: number) => Math.round(n / 10) * 10;
  return [
    { tier: 'basic', title: 'Basic', description: 'แพ็กเกจเริ่มต้น เหมาะสำหรับงานขนาดเล็ก', price: base, deliveryDays: days, revisions: 2, features: f.slice(0, 2) },
    { tier: 'standard', title: 'Standard', description: 'แพ็กเกจยอดนิยม ครบทุกสิ่งที่ธุรกิจต้องการ', price: round(base * 1.8), deliveryDays: days + 2, revisions: 4, features: f.slice(0, 3) },
    { tier: 'premium', title: 'Premium', description: 'แพ็กเกจจัดเต็ม งานด่วนและดูแลพิเศษ', price: round(base * 3), deliveryDays: days + 4, revisions: 99, features: f },
  ];
}

const commonFaqs = [
  { q: 'ต้องเตรียมข้อมูลอะไรบ้างก่อนเริ่มงาน?', a: 'แจ้งรายละเอียดงาน ตัวอย่างที่ชอบ และกำหนดส่งที่ต้องการผ่านแชท ฟรีแลนซ์จะสรุปขอบเขตงานให้ก่อนเริ่ม' },
  { q: 'ถ้าไม่พอใจงานสามารถแก้ไขได้ไหม?', a: 'แก้ไขได้ตามจำนวนครั้งที่ระบุในแพ็กเกจ และเงินของคุณจะถูกพักไว้กับระบบจนกว่าคุณจะอนุมัติงาน' },
  { q: 'ออกใบกำกับภาษีได้หรือไม่?', a: 'สามารถขอใบเสร็จรับเงินและใบกำกับภาษีได้จากหน้าคำสั่งซื้อหลังชำระเงิน' },
];

export const seedServices: Service[] = rows.map(
  ([id, title, category, subcategory, sellerId, base, days, rating, reviewCount, sold, badges], i) => ({
    id,
    title,
    category,
    subcategory,
    sellerId,
    motif: i % 6,
    rating,
    reviewCount,
    sold,
    badges,
    description: `${title}\n\nบริการนี้ดูแลโดยฟรีแลนซ์ที่ผ่านการคัดกรอง เราจะคุยรายละเอียดกับคุณก่อนเริ่มงาน เพื่อให้ได้ผลงานตรงใจที่สุด ส่งงานตรงเวลา และแก้ไขได้ตามแพ็กเกจ\n\nขั้นตอนการทำงาน\n• คุยรายละเอียดและสรุปขอบเขตงาน\n• ส่งแบบร่างให้ตรวจ\n• ปรับแก้ตามความต้องการ\n• ส่งมอบไฟล์งานฉบับสมบูรณ์`,
    packages: packagesFor(category, base, days),
    faqs: commonFaqs,
    createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
  }),
);

export const seedServiceIds = seedServices.map((x) => x.id);

const reviewTexts = [
  'งานดีมาก ส่งไวกว่ากำหนด สื่อสารง่าย แนะนำเลยครับ',
  'ประทับใจมากค่ะ แก้งานให้จนพอใจ จะกลับมาใช้บริการอีก',
  'คุณภาพเกินราคา ตอบแชทเร็ว เป็นมืออาชีพ',
  'Great communication and fast delivery. Highly recommended!',
  'โดยรวมดีครับ มีปรับแก้นิดหน่อยแต่ผลลัพธ์ออกมาสวย',
];
const authors = ['คุณปุ๊ก', 'Tanawat K.', 'คุณมายด์', 'Sarah L.', 'คุณบอส', 'คุณแพร', 'Krit P.'];

export const seedReviews: Review[] = seedServices.flatMap((svc, i) =>
  [0, 1, 2].map((j) => ({
    id: `r-${svc.id}-${j}`,
    serviceId: svc.id,
    author: authors[(i + j) % authors.length] ?? 'ผู้ว่าจ้าง',
    rating: j === 2 && svc.rating < 4.9 ? 4 : 5,
    text: reviewTexts[(i + j) % reviewTexts.length] ?? '',
    date: new Date(Date.UTC(2026, 9, 28 - j * 9 - (i % 7))).toISOString(),
  })),
);

export const testimonials = [
  { name: 'คุณนภา', role: 'เจ้าของแบรนด์สกินแคร์', text: 'หาดีไซเนอร์ทำแพ็กเกจจิ้งได้ภายในวันเดียว งานสวยและเงินปลอดภัยเพราะพักไว้กับระบบจนเราอนุมัติ' },
  { name: 'Mr. James', role: 'Startup Founder', text: 'We launched our website in two weeks. The milestone payments made it easy to trust a freelancer we had never met.' },
  { name: 'คุณต้น', role: 'ผู้จัดการฝ่ายการตลาด', text: 'ใช้ฟรีแลนซ์ยิงแอดและตัดต่อวิดีโอเป็นประจำ ประหยัดกว่าจ้างประจำ และได้คนเก่งเฉพาะทาง' },
];
