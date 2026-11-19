import type { Category, CategorySlug } from '@/lib/types';

export const categories: Category[] = [
  {
    slug: 'graphic-design',
    name: 'กราฟิกและดีไซน์',
    nameEn: 'Graphic & Design',
    icon: 'palette',
    hue: 222,
    subcategories: [
      { slug: 'logo', name: 'ออกแบบโลโก้' },
      { slug: 'banner', name: 'แบนเนอร์โฆษณา' },
      { slug: 'packaging', name: 'บรรจุภัณฑ์และฉลาก' },
      { slug: 'illustration', name: 'วาดภาพประกอบ' },
      { slug: 'ci', name: 'อัตลักษณ์องค์กร (CI)' },
      { slug: 'interior', name: 'ออกแบบภายใน' },
    ],
  },
  {
    slug: 'web-programming',
    name: 'เว็บไซต์และโปรแกรม',
    nameEn: 'Web & Programming',
    icon: 'code',
    hue: 200,
    subcategories: [
      { slug: 'website', name: 'สร้างเว็บไซต์' },
      { slug: 'wordpress', name: 'WordPress' },
      { slug: 'mobile-app', name: 'แอปพลิเคชันมือถือ' },
      { slug: 'ux-ui', name: 'UX/UI' },
      { slug: 'line-oa', name: 'LINE OA และแชทบอท' },
      { slug: 'data', name: 'Data และ Automation' },
    ],
  },
  {
    slug: 'marketing',
    name: 'การตลาดและโฆษณา',
    nameEn: 'Marketing & Advertising',
    icon: 'megaphone',
    hue: 12,
    subcategories: [
      { slug: 'facebook-ads', name: 'ยิงแอด Facebook' },
      { slug: 'google-ads', name: 'Google Ads' },
      { slug: 'seo', name: 'SEO' },
      { slug: 'admin', name: 'แอดมินเพจ' },
      { slug: 'tiktok', name: 'TikTok Marketing' },
      { slug: 'review', name: 'รีวิวสินค้า' },
    ],
  },
  {
    slug: 'writing-translation',
    name: 'งานเขียนและแปลภาษา',
    nameEn: 'Writing & Translation',
    icon: 'pen',
    hue: 160,
    subcategories: [
      { slug: 'article', name: 'เขียนบทความ' },
      { slug: 'copywriting', name: 'Copywriting' },
      { slug: 'translate-en', name: 'แปลไทย-อังกฤษ' },
      { slug: 'translate-cn', name: 'แปลจีน' },
      { slug: 'proofreading', name: 'พิสูจน์อักษร' },
    ],
  },
  {
    slug: 'video-audio',
    name: 'ภาพและเสียง',
    nameEn: 'Video & Audio',
    icon: 'video',
    hue: 280,
    subcategories: [
      { slug: 'video-editing', name: 'ตัดต่อวิดีโอ' },
      { slug: 'motion', name: 'Motion Graphic' },
      { slug: 'voice-over', name: 'พากย์เสียง' },
      { slug: 'photography', name: 'ถ่ายภาพ' },
      { slug: 'music', name: 'ทำเพลงและดนตรี' },
    ],
  },
  {
    slug: 'business-consulting',
    name: 'ปรึกษาธุรกิจ',
    nameEn: 'Business & Consulting',
    icon: 'briefcase',
    hue: 40,
    subcategories: [
      { slug: 'accounting', name: 'บัญชีและภาษี' },
      { slug: 'legal', name: 'กฎหมายและจดทะเบียน' },
      { slug: 'business-plan', name: 'แผนธุรกิจ' },
      { slug: 'hr', name: 'HR และสรรหาบุคลากร' },
    ],
  },
  {
    slug: 'lifestyle',
    name: 'ไลฟ์สไตล์',
    nameEn: 'Lifestyle',
    icon: 'heart',
    hue: 330,
    subcategories: [
      { slug: 'fortune', name: 'ดูดวง' },
      { slug: 'fitness', name: 'ฟิตเนสและสุขภาพ' },
      { slug: 'tutor', name: 'ติวเตอร์' },
      { slug: 'travel', name: 'วางแผนท่องเที่ยว' },
    ],
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return categories.some((c) => c.slug === slug);
}

export const trendingKeywords = ['โลโก้', 'ตัดต่อวิดีโอ', 'ยิงแอด Facebook', 'เว็บไซต์', 'แปลภาษา', 'แอดมินเพจ', 'SEO', 'พากย์เสียง'];

export const heroWords = ['ออกแบบโลโก้', 'ทำเว็บไซต์', 'ยิงแอด', 'ตัดต่อวิดีโอ', 'แปลภาษา'];
