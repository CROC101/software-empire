import type { Seller } from '@/lib/types';

const s = (
  id: string,
  name: string,
  hue: number,
  level: Seller['level'],
  responseMinutes: number,
  memberSince: string,
  bio: string,
): Seller => ({ id, name, hue, level, responseMinutes, memberSince, location: 'กรุงเทพมหานคร', bio, languages: ['ไทย', 'English'] });

export const sellers: Seller[] = [
  s('s1', 'PixelPlant Studio', 222, 'pro', 4, '2019', 'ทีมนักออกแบบกราฟิก ประสบการณ์กว่า 8 ปี เน้นงานแบรนด์ดิ้งสำหรับ SME'),
  s('s2', 'Nok Codes', 200, 'top', 12, '2020', 'Full-stack developer ทำเว็บไซต์และระบบหลังบ้าน ส่งงานตรงเวลา'),
  s('s3', 'Mint Marketing', 12, 'top', 6, '2018', 'นักการตลาดออนไลน์ ดูแลแอดให้แบรนด์กว่า 300 ราย'),
  s('s4', 'WordSmith TH', 160, 'verified', 20, '2021', 'นักเขียนและนักแปล จบอักษรศาสตร์ เขียนได้ทั้งไทยและอังกฤษ'),
  s('s5', 'Frame by Fon', 280, 'pro', 9, '2019', 'ตัดต่อวิดีโอสำหรับ YouTube, TikTok และโฆษณา'),
  s('s6', 'Biz Mentor Co.', 40, 'verified', 30, '2022', 'ที่ปรึกษาธุรกิจและบัญชี สำหรับธุรกิจเริ่มต้น'),
  s('s7', 'Lucky Star', 330, 'new', 45, '2024', 'ดูดวงไพ่ยิปซีและพื้นดวง อ่านละเอียด เป็นกันเอง'),
  s('s8', 'Arty Bee', 250, 'top', 8, '2020', 'นักวาดภาพประกอบ สไตล์น่ารัก เหมาะกับแบรนด์และหนังสือเด็ก'),
  s('s9', 'AppForge', 190, 'pro', 15, '2018', 'ทีมพัฒนาแอปพลิเคชัน iOS และ Android ครบวงจร'),
  s('s10', 'SEO Sensei', 100, 'verified', 25, '2021', 'ผู้เชี่ยวชาญ SEO ดันอันดับ Google แบบยั่งยืน'),
  s('s11', 'Voice by Kwan', 300, 'top', 10, '2020', 'นักพากย์เสียงมืออาชีพ โทนเสียงหลากหลาย'),
  s('s12', 'LawEase', 60, 'pro', 18, '2019', 'ทนายความและที่ปรึกษากฎหมาย จดทะเบียนบริษัทครบจบ'),
];

export function getSeller(id: string): Seller | undefined {
  return sellers.find((x) => x.id === id);
}

export const levelLabel: Record<Seller['level'], string> = {
  new: 'ฟรีแลนซ์ใหม่',
  verified: 'ยืนยันตัวตนแล้ว',
  top: 'Top Rated',
  pro: 'Pro',
};
