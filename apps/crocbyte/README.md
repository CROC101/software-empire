# CrocByte

เว็บรับงานของเจ้าของ (crocwork.studio) — ร้านของคนเดียว ระบบสมาชิก VIP อันดับลูกค้า และแชตหน้า Ranking
อยู่บน **Firebase** เป็นข้อยกเว้นของ monorepo (ADR-06 ใน `docs/MASTER-SPEC.md`) ระบบอื่นใช้ Supabase ของ Core Hub

- dev: `pnpm --filter @empire/crocbyte dev` → http://localhost:3007
- ⚠️ `.env.local` ชี้ไปที่ Firebase **ตัวจริง** (`crocbyte-system`) — สิ่งที่กดในเครื่องเปลี่ยนข้อมูลบนเว็บจริงทันที
  ถ้าจะลองแบบไม่กระทบลูกค้า ให้สร้าง project แยก (`crocbyte-dev`) แล้วเปลี่ยนค่าใน `.env.local`

## โครงข้อมูล (Firestore)

| collection              | เก็บอะไร                                  | ใครอ่าน               | ใครเขียน                                          |
| ----------------------- | ----------------------------------------- | --------------------- | ------------------------------------------------- |
| `users/{uid}`           | ชื่อจริง เบอร์ ที่อยู่ LINE ยอดสะสม VIP   | เจ้าของ + แอดมิน      | เจ้าของ (เฉพาะข้อมูลติดต่อ/รูป), แอดมิน           |
| `leaderboard/{uid}`     | ชื่อ รูป ยอดสะสม VIP (สำหรับหน้า Ranking) | ทุกคน                 | แอดมิน (หน้า admin sync จาก `users` ให้อัตโนมัติ) |
| `transactions/{id}`     | รายการซื้อ สลิป งานที่ส่ง                 | ลูกค้าคนนั้น + แอดมิน | แอดมิน                                            |
| `services/{id}`         | บริการและแพ็กเกจ                          | ทุกคน                 | แอดมิน                                            |
| `system/info`           | ข้อความอัปเดตระบบ                         | ทุกคน                 | แอดมิน                                            |
| `ranking_comments/{id}` | แชตหน้า Ranking                           | ทุกคน                 | สมาชิก (ของตัวเอง), รีแอ็กชันได้ทุกข้อความ        |

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

**Cloudflare Workers — ฟรี** (ADR-05) ผ่าน OpenNext · build บน GitHub Actions
(`.github/workflows/crocbyte-cloudflare.yml`) เพราะ OpenNext ต้องใช้ symlink ที่ Windows ไม่ยอมถ้าไม่เปิด Developer Mode
แผนฟรี: 100,000 request/วัน · Worker ไม่เกิน 3 MiB (gzip) — PR ทุกอันเช็กขนาดให้

ตั้งครั้งเดียว (ทำเองในหน้าเว็บ ห้ามวาง token ในแชต):

1. สมัคร Cloudflare (ฟรี) → My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers**
2. GitHub repo → Settings → Secrets and variables → Actions
   - **Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (Account ID อยู่หน้า Workers & Pages ด้านขวา)
   - **Variables:** `CROCBYTE_FIREBASE_API_KEY`, `CROCBYTE_FIREBASE_AUTH_DOMAIN`, `CROCBYTE_FIREBASE_PROJECT_ID`,
     `CROCBYTE_FIREBASE_STORAGE_BUCKET`, `CROCBYTE_FIREBASE_MESSAGING_SENDER_ID`, `CROCBYTE_FIREBASE_APP_ID`
     (ค่าเดียวกับ `.env.local`), `CROCBYTE_HUB_URL`, `CROCBYTE_COOKIE_DOMAIN` (ว่างได้ถ้ายังไม่มีโดเมนร่วม)
3. merge เข้า `main` → workflow deploy เอง ได้ URL `https://crocbyte.<ชื่อบัญชี>.workers.dev`
4. **Firebase console → Authentication → Settings → Authorized domains → เพิ่มโดเมนใหม่** ไม่งั้นล็อกอิน Google ไม่ผ่าน
5. ใช้ได้ครบแล้วค่อยย้ายโดเมนจริง: Workers → crocbyte → Settings → Domains & Routes (ต้องให้ Cloudflare ดูแล DNS ของโดเมน)
   แล้วปิด project บน Vercel · archive repo `Sarawut2005-icloud/Crocbyte`

ลองแบบ Worker ในเครื่อง (ต้อง Linux/WSL หรือ Windows Developer Mode): `pnpm --filter @empire/crocbyte cf:preview`

## สิ่งที่ยังค้าง

- ESLint/TS ยังผ่อนเป็น legacy (ดู `eslint.config.js`) — เก็บตอนแตะแต่ละหน้า
- Dashboard แก้ชื่อ/รูปแล้ว `leaderboard` จะอัปเดตตอนแอดมินเปิดหน้า admin ครั้งถัดไป
