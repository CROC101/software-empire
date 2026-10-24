# CrocByte

เว็บรับงานของเจ้าของ (crocwork.studio) — ร้านของคนเดียว ระบบสมาชิก VIP อันดับลูกค้า และแชตหน้า Ranking
อยู่บน **Firebase** เป็นข้อยกเว้นของ monorepo (ADR-06 ใน `docs/MASTER-SPEC.md`) ระบบอื่นใช้ Supabase ของ Core Hub

- dev: `pnpm --filter @empire/crocbyte dev` → http://localhost:3007
- ⚠️ `.env.local` ชี้ไปที่ Firebase **ตัวจริง** (`crocbyte-system`) — สิ่งที่กดในเครื่องเปลี่ยนข้อมูลบนเว็บจริงทันที
  ถ้าจะลองแบบไม่กระทบลูกค้า ให้สร้าง project แยก (`crocbyte-dev`) แล้วเปลี่ยนค่าใน `.env.local`

## โครงข้อมูล (Firestore)

| collection | เก็บอะไร | ใครอ่าน | ใครเขียน |
|---|---|---|---|
| `users/{uid}` | ชื่อจริง เบอร์ ที่อยู่ LINE ยอดสะสม VIP | เจ้าของ + แอดมิน | เจ้าของ (เฉพาะข้อมูลติดต่อ/รูป), แอดมิน |
| `leaderboard/{uid}` | ชื่อ รูป ยอดสะสม VIP (สำหรับหน้า Ranking) | ทุกคน | แอดมิน (หน้า admin sync จาก `users` ให้อัตโนมัติ) |
| `transactions/{id}` | รายการซื้อ สลิป งานที่ส่ง | ลูกค้าคนนั้น + แอดมิน | แอดมิน |
| `services/{id}` | บริการและแพ็กเกจ | ทุกคน | แอดมิน |
| `system/info` | ข้อความอัปเดตระบบ | ทุกคน | แอดมิน |
| `ranking_comments/{id}` | แชตหน้า Ranking | ทุกคน | สมาชิก (ของตัวเอง), รีแอ็กชันได้ทุกข้อความ |

แอดมิน = อีเมล `ADMIN_EMAIL` ใน `src/app/admin/page.tsx` และใน `firestore.rules` (ต้องตรงกัน)

## Security rules — ลำดับที่ปลอดภัย

กฎอยู่ใน `firestore.rules` และ `storage.rules` ห้ามสลับลำดับ ไม่งั้นหน้า Ranking จะว่าง:

1. **deploy โค้ดใหม่ก่อน** (หัวข้อ Deploy ด้านล่าง) — หน้า Ranking อ่าน `leaderboard` แทน `users` แล้ว
2. **แอดมินเปิดหน้า `/admin` หนึ่งครั้ง** — หน้า admin สร้าง `leaderboard` จาก `users` ให้ครบ (ดูใน Firebase console ว่ามี collection `leaderboard`)
3. **ค่อย deploy กฎ:**
   ```
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage --project crocbyte-system
   ```
   (รันในโฟลเดอร์ `apps/crocbyte` — `firebase.json` ชี้ไปที่ไฟล์กฎทั้งสอง)
4. เปิดหน้า Ranking, Dashboard, Services และสมัครสมาชิกใหม่ ลองให้ครบ — ถ้ามีหน้าไหน error `permission-denied` ดูที่ console แล้วปรับกฎ

ก่อน deploy กฎ ลองบน Rules Playground ใน Firebase console ได้ (Firestore → Rules → Rules Playground)

## Deploy จาก monorepo

ตัวหลักของโค้ดคือ `apps/crocbyte` ใน monorepo นี้ repo `Sarawut2005-icloud/Crocbyte` เดิมเลิกแก้ (archive ไว้)

**Vercel** (ตั้งค่า project ของเว็บเดิม):
- Root Directory: `apps/crocbyte` · Framework: Next.js · Install Command: `pnpm install` (Vercel ตรวจ pnpm workspace เอง)
- Environment Variables: ค่า `NEXT_PUBLIC_FIREBASE_*` ทั้ง 6 ตัว, `NEXT_PUBLIC_HUB_URL`, `NEXT_PUBLIC_COOKIE_DOMAIN` (ถ้ามีโดเมนร่วมกับ hub)
- Git: เชื่อม repo `CROC101/software-empire` แทน repo เดิม — push เข้า `main` แล้ว deploy เอง

⚠️ **Vercel Hobby ห้ามใช้เชิงพาณิชย์** และเว็บนี้รับงานจริง ทางที่ถูก: Vercel Pro หรือ Cloudflare Pages (ADR-05)
ผ่าน OpenNext adapter — คุยก่อนตัดสินใจ เพราะ Pro มีค่าใช้จ่าย

## สิ่งที่ยังค้าง

- ESLint/TS ยังผ่อนเป็น legacy (ดู `eslint.config.js`) — เก็บตอนแตะแต่ละหน้า
- Dashboard แก้ชื่อ/รูปแล้ว `leaderboard` จะอัปเดตตอนแอดมินเปิดหน้า admin ครั้งถัดไป
