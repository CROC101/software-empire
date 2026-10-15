# Software Empire — คู่มือสำหรับ Claude

Portfolio ระดับ Enterprise ของเจ้าของคนเดียว (PM + PL + AIE ในคนเดียว) จำลองโครงสร้างองค์กรแบบ CSMJU2030
แต่ไม่ใช่ MIS — เป็นชุดแอป 1 Hub + 7 ระบบย่อย บน monorepo เดียว

- สเปกเต็ม + การตัดสินใจ (ADR): [`docs/MASTER-SPEC.md`](docs/MASTER-SPEC.md)
- ตั้ง GitHub org / teams / rulesets: [`docs/GITHUB-ORG-PLAYBOOK.md`](docs/GITHUB-ORG-PLAYBOOK.md)
- ต้นแบบมาตรฐาน (อ่านอย่างเดียว): `ตัวอย่างของ PM/csmju2030-standards-main/` · `ตัวอย่างของ PM/csmju-core-hub-main/`
- โค้ดเดิมที่ dupe ได้ (อ่านอย่างเดียว, design ทำใหม่): `แหล่งรวมโปรเจคเดิมสามารถ Dupes มาได้/` (canvas · nexus · toolboxes)

## บทบาทเจ้าของ

- **PM** — ลำดับความสำคัญ, acceptance criteria (Definition of Done)
- **PL** — คุณภาพ UI/UX, `packages/ui` (Tailwind v4 + shadcn/ui), อนุมัติ trade-off สถาปัตยกรรม
- **AIE** — client-side AI (WebGPU / Transformers.js / BYOK), Web Workers, prompt pipeline, MCP

Claude ทำงานแทน AIE ได้เต็มที่ภายใน `D:\projects\software-empire` — สร้างไฟล์ ติดตั้ง package refactor ได้เลย
ถามก่อนเมื่อ: เปลี่ยน ADR ใน MASTER-SPEC, เพิ่มบริการที่มีค่าใช้จ่าย, หรือทำอะไรบน GitHub/Supabase จริง (push, สร้าง repo, migration บน prod)

## โครงสร้าง (เป้าหมาย)

```
apps/hub        Core Hub — SSO, dashboard, portfolio showroom     (Next.js)
apps/community  ระบบย่อย 1 — แชต realtime  (dupe จาก nexus)        (Vite)
apps/commerce   ระบบย่อย 2 — ตลาดฟรีแลนซ์ + escrow จำลอง           (Next.js)
apps/toolboxes  ระบบย่อย 3 — dev tools + MCP inspector (dupe)      (Vite)
apps/tarot      ระบบย่อย 4 — AI tarot 3D, WebGPU/BYOK             (Vite)
apps/design     ระบบย่อย 5 — component & prompt registry          (Next.js)
apps/canva      ระบบย่อย 6 — canvas editor (dupe จาก canvas)       (Vite)
apps/stream     ระบบย่อย 7 — audio player + Media Session          (Vite)
packages/ui     design system กลาง
packages/config eslint / tsconfig / tailwind preset
packages/core   Supabase client, auth helpers, Zod schemas, SW
standards/      กฎ + สคริปต์ตรวจ (แบบ csmju2030-standards ย่อส่วน)
```

## คำสั่ง (pnpm 12 · Node 24 · Turborepo)

```powershell
pnpm install
pnpm verify          # lint + typecheck + test + build ทุก package (เหมือน CI job `verify`)
pnpm format:check    # CI รันด้วย · แก้ด้วย pnpm format
pnpm --filter <pkg> <script>

pnpm db:start        # Supabase ในเครื่อง (Docker) เฉพาะ db + auth + rest · pnpm db:status ดู URL/key
pnpm db:reset        # ล้างฐาน + รัน supabase/migrations ใหม่ (ลบผู้ใช้ทดสอบด้วย)
pnpm db:test         # pgTAP ใน supabase/tests — RLS ทุกตารางต้องมีเทสต์
pnpm db:types        # สร้าง packages/core/src/database.types.ts ใหม่หลังแก้ migration
pnpm --filter @empire/hub dev        # http://localhost:3000
pnpm --filter @empire/toolboxes dev  # http://localhost:3003
pnpm --filter @empire/canva dev      # http://localhost:3006 (ต้องล็อกอิน)
pnpm --filter @empire/community dev  # http://localhost:3001 (ต้องล็อกอิน)
pnpm --filter @empire/community smoke  # social graph ผ่าน HTTP จริง (ต้อง db:start)
```

- `db:start` เปิด storage + realtime ด้วย · DB volume เก่า + schema ใหม่ใน `[api] schemas` → PostgREST 503 ตอน start: ใช้ `supabase start --ignore-health-check ...` แล้ว `pnpm db:reset`
- canva / community: หน้าจอเดิมของ csmju-canvas / csmju-nexus เรียก `api.get('/designs/…')` → `src/lib/backend/api.ts` ของแอปแปลงเป็น Supabase · path ที่ยังไม่รองรับตอบ 501 · `lib/router.tsx` แทน `next/link` / `next/navigation` · unit test ใช้ `src/test/router-mock.tsx` แทน router จริง
- community ย้ายทีละรอบ (Full Nexus): 1 social graph ✅ · 2 แชต + Realtime ✅ (`socket.ts` = ตัวกระจาย event แบบ socket.io ที่ป้อนด้วย Supabase Realtime · `pnpm --filter @empire/community smoke:chat`) · 3 ฟีด + อัปโหลด · 4 reels/stories/notes · 5 แจ้งเตือน/ค้นหา/ตั้งค่า · 6 ประชุม/เสียง (WebRTC) · 7 admin/report
- กติกาความเป็นส่วนตัว (บล็อก · ใครเห็นอะไร) ต้องอยู่ใน RLS / ฟังก์ชัน SQL พร้อม pgTAP — ห้ามอยู่แค่ใน `api.ts`
- `pnpm verify` จำกัด `--concurrency=50%` — ถ้ารันพร้อมกันหมด worker ของ vitest start ไม่ทัน

- ทุกแอปต้องมี `.env.local` (ลอกจาก `.env.example`) · hub ต้องมี `APP_URL_<SLUG>` ของแอปที่เปิดแล้ว ไม่งั้นลิงก์และการพากลับหลังล็อกอินไม่ทำงาน
- แก้ `[api] schemas` ใน `supabase/config.toml` แล้วต้อง `pnpm db:stop && pnpm db:start` (`db:reset` ไม่โหลดค่านี้ใหม่ — อาการคือ 406)
- ใช้ `localhost` ไม่ใช่ `127.0.0.1` — cookie ผูกกับชื่อ host และ `supabase/config.toml` ลงทะเบียน redirect เป็น localhost · cookie ไม่สนพอร์ต แอปในเครื่องทุกพอร์ตจึงเห็น session เดียวกัน
- 1 แอป = 1 Postgres schema (`toolboxes`, …) + RLS ตาม ADR-02 · เพิ่ม schema แล้วใส่ใน `[api] schemas` และ `db:types`
- SPA: Supabase SDK โหลดแบบ lazy (`loadSupabase()`) ไม่ให้ถ่วงหน้าแรก · ล็อกอินที่ hub เสมอ (`signInUrl()`)
- Auth ฝั่ง server: ใช้ `getClaims()` (ตรวจลายเซ็น JWT) เท่านั้น ห้ามเชื่อ `getSession()` · ทุก `?next=` ผ่าน `safeNext` (hub) / `safeRedirectTarget` จาก `@empire/core/redirect`
- สร้าง Supabase client ผ่าน `@empire/core/supabase` เสมอ — cookie options ต้องเหมือนกันทุกแอปไม่งั้น SSO ข้าม subdomain พัง
- Worker: export method ผ่าน `validated(schema, fn)` + `expose` จาก `@empire/core/worker`
- package ใหม่: `eslint.config.js` = `base(import.meta.dirname)` จาก `@empire/config/eslint` (SPA ใช้ `react()` จาก `@empire/config/eslint/react`) · `tsconfig.json` extends `@empire/config/tsconfig/base.json` (หรือ `react.json`)
- TypeScript ล็อก `~6.0` — typescript-eslint ยังไม่รองรับ TS 7 · TS 6 ตั้ง `types: []` เป็นค่าเริ่มต้น ต้องใส่ `types` เองเมื่อใช้ `node` / `vite/client`

## กฎที่ห้ามละเมิด

1. งานทั้งหมดอยู่ใน `D:\projects\software-empire` · ชื่อไฟล์/โฟลเดอร์ใหม่ใช้ ASCII ไม่มีช่องว่าง
2. ทุกตาราง Supabase เปิด RLS · policy ผูก `auth.uid()` · ไม่มีตารางที่ anon อ่าน/เขียนได้โดยไม่ตั้งใจ
3. ห้ามเก็บ access token ใน `localStorage` — ใช้ cookie ของ `@supabase/ssr`
4. ตรวจ input ทุกขอบเขต (form, API, `postMessage` ของ Worker) ด้วย Zod · HTML/Markdown ของผู้ใช้ผ่าน DOMPurify ก่อน render
5. งานหนัก (parse, image, audio decode, ML) ไปอยู่ใน Web Worker + Comlink · main thread ไว้ render
6. ห้ามเพิ่มบริการเสียเงินโดยไม่ถาม · ห้าม commit `.env` หรือ secret
7. สีและระยะใช้ design token จาก `packages/ui` ไม่ใช้ค่าดิบ
8. Commit แบบ Conventional Commits: `feat(<app>): ...` · branch `feature/<app>/<เรื่อง>`

## GitHub (CROC101/software-empire · public)

- `main` ป้องกันด้วย ruleset `main-protection-solo`: ต้องผ่าน PR + check `verify` · approve 0 คน (ทำคนเดียว)
- branch: `feature|fix|chore|docs/<app>/<เรื่อง>` → PR เข้า `main` · merge แล้วลบ branch อัตโนมัติ
- เปิด squash และ merge commit (merge commit ไว้สำหรับ PR ที่ซ้อนกัน) · secret scanning + push protection + Dependabot เปิดแล้ว
- teams (pm/pl/aie) ยังไม่ได้สร้าง — ต้องใช้สิทธิ์ `admin:org` (ทำในหน้าเว็บ หรือ `gh auth refresh -s admin:org`)

## MCP ที่ตั้งไว้ (`.mcp.json`)

- `github` — remote server ของ GitHub, ต้องตั้ง env `GITHUB_PAT` (fine-grained token)
- `memory` — knowledge graph ข้ามเซสชัน เก็บที่ `.claude/mcp-memory.jsonl`
- `filesystem` — จำกัดที่ `D:\projects\software-empire`
- Supabase MCP — ยังไม่ติดตั้ง จะเพิ่มเมื่อมี project จริง (ดู MASTER-SPEC §9)
