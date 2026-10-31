# ขึ้นเว็บจริง (ฟรีทั้งหมด) — ตั้งครั้งเดียว

สถาปัตยกรรม (ADR-05): หน้าเว็บทุกแอปอยู่บน **Cloudflare Workers** ฟรี · ฐานข้อมูล/ล็อกอิน/ไฟล์อยู่บน
**Supabase Cloud** ฟรี project เดียว · ทุกอย่าง deploy ผ่าน **GitHub Actions** ไม่ต้องใช้บัตรเครดิตที่ไหนเลย

| workflow                  | ทำอะไร                                                                  | เริ่มทำงานเมื่อ                                   |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `ci.yml`                  | format + lint + typecheck + test + build ทุกแอป · ตรวจ dependency ใหม่  | ทันที                                             |
| `deploy.yml`              | build ทุกแอปเป็น Worker · PR = เช็กขนาด + preview URL · main = ขึ้นจริง | build ทันที · ขึ้นจริงเมื่อมี secret Cloudflare   |
| `database.yml`            | pgTAP ทุกข้อบนฐานชั่วคราว · main = `supabase db push` หลังเทสต์ผ่าน     | เทสต์ทันที · push เมื่อมี secret Supabase         |
| `keep-alive.yml`          | เรียก Supabase วันละครั้ง กัน project หลับ (แผนฟรีหลับเมื่อเงียบ 7 วัน) | เมื่อตั้ง `SUPABASE_URL`                          |
| `backup.yml`              | dump ฐานข้อมูลทุกคืน เข้ารหัส แล้วเก็บ 30 วัน                           | เมื่อตั้ง `SUPABASE_DB_URL` + `BACKUP_PASSPHRASE` |
| `codeql.yml`              | สแกนช่องโหว่ในโค้ดและ workflow                                          | ทันที                                             |
| `crocbyte-cloudflare.yml` | CrocByte (Firebase) บน Worker แยก                                       | ตาม `apps/crocbyte/README.md`                     |

**ห้ามวาง token / รหัสผ่านในแชต** — ใส่เองในหน้า GitHub เท่านั้น (Settings → Secrets and variables → Actions)

## 1. GitHub CLI (ครั้งเดียว)

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth login --web --git-protocol https
```

## 2. Cloudflare

1. dash.cloudflare.com → **Workers & Pages** → ดู **Account ID** (ขวามือ) และ subdomain ของคุณ
   (`<ชื่อ>.workers.dev` — ถ้ายังไม่มีให้ตั้ง)
2. My Profile → **API Tokens** → Create Token → template **Edit Cloudflare Workers** → Create
3. GitHub → Settings → Secrets and variables → Actions
   - **Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - **Variables:** `CF_WORKERS_SUBDOMAIN` = ส่วน `<ชื่อ>` ของ `<ชื่อ>.workers.dev`

แอปจะอยู่ที่ `https://crocwork-<แอป>.<ชื่อ>.workers.dev` (hub, commerce, toolboxes, canva, community)

## 3. Supabase

1. supabase.com → Continue with GitHub → New project · region **Southeast Asia (Singapore)** ·
   ตั้งรหัส DB ยาว ๆ แล้วจดไว้
2. Project Settings → **API**: เพิ่ม schema ใน _Exposed schemas_:
   `toolboxes, canva, community, commerce, cms`
3. Authentication → URL Configuration: _Site URL_ = URL ของ hub · _Redirect URLs_ = `https://crocwork-*.<ชื่อ>.workers.dev/**`
4. GitHub → Settings → Secrets and variables → Actions
   - **Variables:** `SUPABASE_URL` (Project URL), `SUPABASE_PUBLISHABLE_KEY` (publishable key),
     `SUPABASE_PROJECT_REF` (รหัสใน URL ของ project)
   - **Secrets:** `SUPABASE_ACCESS_TOKEN` (Account → Access Tokens), `SUPABASE_DB_PASSWORD`,
     `SUPABASE_DB_URL` (Connect → Session pooler URI ที่ใส่รหัสแล้ว),
     `BACKUP_PASSPHRASE` (สุ่มยาว ๆ อย่างน้อย 32 ตัว **จดเก็บไว้ที่อื่นด้วย** — หายแล้วเปิด backup ไม่ได้)
5. merge เข้า main ครั้งแรก → `database.yml` push migration ทั้งหมด (seed บัญชีเดโมไม่ขึ้นของจริง)
6. สมัครบัญชีที่ hub ตัวจริง แล้วรันใน SQL Editor ของ Supabase (ตั้งตัวเองเป็นแอดมิน CMS):
   ```sql
   insert into cms.admins (user_id) select id from auth.users where email = '<อีเมลคุณ>';
   ```

## 4. โดเมนของตัวเอง (ทีหลัง)

`*.workers.dev` อยู่ใน Public Suffix List → cookie ข้ามแอปไม่ได้ (ล็อกอินแยกต่อแอป) ได้โดเมนแล้ว:

1. เพิ่มโดเมนใน Cloudflare (Add a domain) → เปลี่ยน nameserver ที่ผู้ขายโดเมนเป็นของ Cloudflare
2. Workers → แต่ละแอป → Settings → Domains & Routes → Custom domain (`hub.<โดเมน>`, `canva.<โดเมน>` …)
3. GitHub Variables: `SITE_HUB`, `SITE_COMMERCE`, `SITE_TOOLBOXES`, `SITE_CANVA`, `SITE_COMMUNITY`,
   `SITE_CROCBYTE` = URL ใหม่ · `COOKIE_DOMAIN` = `.<โดเมน>` → รัน `deploy` ใหม่ (Actions → deploy → Run workflow)
4. แก้ Site URL / Redirect URLs ใน Supabase ตามโดเมนใหม่

## 5. กู้ข้อมูลจาก backup

Actions → backup → เลือกรอบ → ดาวน์โหลด artifact แล้ว:

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in backup-<วันที่>.tar.gz.enc -pass pass:'<BACKUP_PASSPHRASE>' | tar xz
psql "<DB URL ปลายทาง>" -f roles.sql -f schema.sql -f data.sql
```

## ขีดจำกัดแผนฟรี (เมื่อชนแล้วค่อยขยับ)

- Workers: 100,000 request/วัน (asset ของ SPA ไม่นับ) · Worker ละ 3 MiB gzip
- Supabase: DB 500 MB · ไฟล์ 1 GB · MAU 50,000 · 2 project
- ทางขยาย: VPS + Coolify + Supabase self-host ใช้ migration ชุดเดิม (ADR-05)
