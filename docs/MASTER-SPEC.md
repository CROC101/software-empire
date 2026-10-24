# 🏛️ Software Empire — Master Specification & Operational Playbook

> **เจ้าของ:** คนเดียว ถือ 3 บทบาท (PM · PL · AIE) · **ตำแหน่ง:** `D:\projects\software-empire`
> **กลยุทธ์:** Zero-cost · PWA-first · Client-side-first · Security by default · พร้อมขยายเป็นทีม
> **ต้นทาง:** เรียบเรียงจากร่างของ Gemini + โครงสร้าง CSMJU2030 (standards 1.9.0, core-hub) + โปรเจกต์เดิม (canvas · nexus · toolboxes)
> **อัปเดต:** 2026-10-15

---

## สารบัญ

1. [วิสัยทัศน์](#1-วิสัยทัศน์)
2. [บทบาทและสายการตัดสินใจ](#2-บทบาทและสายการตัดสินใจ)
3. [การตัดสินใจทางสถาปัตยกรรม (ADR)](#3-การตัดสินใจทางสถาปัตยกรรม-adr)
4. [Tech Stack](#4-tech-stack)
5. [โครงสร้าง Monorepo](#5-โครงสร้าง-monorepo)
6. [สเปกระบบย่อย](#6-สเปกระบบย่อย)
7. [Security Shield](#7-security-shield)
8. [Zero-Lag Performance](#8-zero-lag-performance)
9. [MCP & AI Tooling](#9-mcp--ai-tooling)
10. [แผนนำโค้ดเดิมมาใช้ (Dupe Plan)](#10-แผนนำโค้ดเดิมมาใช้-dupe-plan)
11. [Roadmap](#11-roadmap)
12. [ความเสี่ยงที่ต้องรู้](#12-ความเสี่ยงที่ต้องรู้)

---

## 1. วิสัยทัศน์

Portfolio ที่ **พิสูจน์ว่าคนเดียวบริหารระบบระดับองค์กรได้** — ไม่ใช่แค่โชว์หน้าเว็บ แต่โชว์ทั้ง
governance (org, rulesets, CODEOWNERS, compliance gate), สถาปัตยกรรม (SSO กลาง + ระบบย่อย),
และวิศวกรรม (Web Worker, WebGPU, RLS, PWA) ที่ใช้งบ **0 บาท/เดือน**

```text
                    ┌──────────────────────────────┐
                    │   apps/hub  (Core Hub · SSO) │
                    │  Portfolio · Dashboard · Map │
                    └──────────────┬───────────────┘
                                   │ Supabase Auth session (cookie)
   ┌──────────┬──────────┬─────────┼─────────┬──────────┬──────────┐
community  commerce  toolboxes   tarot     design     canva     stream
 (chat)   (escrow)   (dev+MCP)  (WebGPU)  (registry) (editor)  (audio)
   └──────────┴──────────┴─────────┼─────────┴──────────┴──────────┘
                                   │
               ┌───────────────────┴────────────────────┐
               │ Supabase (1 project · schema ต่อ app · RLS) │
               └────────────────────────────────────────┘
```

---

## 2. บทบาทและสายการตัดสินใจ

```text
┌──────────────────────────────────────────────────────────────────┐
│                    HUMAN LEADERSHIP MATRIX                       │
├──────────────────────────────────────────────────────────────────┤
│  PM  Product Manager  → ทำอะไร · เมื่อไร · เสร็จคืออะไร           │
│  PL  Product Leader   → ดีพอไหม · ตรงมาตรฐานไหม · ยอมแลกอะไร     │
│  AIE AI Engineer      → สร้างอย่างไร (Claude ทำงานแทนในบทบาทนี้)   │
└──────────────────────────────────────────────────────────────────┘
```

| บทบาท      | อำนาจ                                           | สิ่งที่ส่งออก                                         | บน GitHub (ดู Playbook)                               |
| ---------- | ----------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| 🎯 **PM**  | ลำดับ backlog, scope, Definition of Done        | Issue + acceptance criteria, Milestone, Project board | team `pm` · Maintain                                  |
| 👑 **PL**  | มาตรฐาน UI/UX, design system, อนุมัติ trade-off | review PR, ADR, `packages/ui`                         | team `pl` · CODEOWNER ของ `packages/ui`, `standards/` |
| 🤖 **AIE** | สถาปัตยกรรม client-side AI, Worker, prompt, MCP | โค้ด, test, PR                                        | team `aie-<app>` · Write                              |

**ใส่หมวกให้ถูกใบ** (ทำคนเดียวแต่แยกจังหวะ):

1. **PM** เขียน issue ก่อนเสมอ — ใช้ template, มี acceptance criteria เป็น checklist
2. **AIE** (คุณ + Claude) ทำบน branch → PR อ้าง `Closes #<issue>`
3. **PL** review PR ตาม checklist ใน PR template ก่อน merge — ถึงจะเป็นคนเดียวกันก็ต้องไล่ checklist

### คำสั่งถาวรถึง Claude (AIE)

มีสิทธิ์ตัดสินใจระดับ implementation เต็มที่: เลือก library เสริม, ออกแบบ schema, refactor —
ตราบที่ไม่ขัด ADR ข้อ 3 และกฎใน [`CLAUDE.md`](../CLAUDE.md) · การเปลี่ยน ADR = ต้องให้ PL อนุมัติ

---

## 3. การตัดสินใจทางสถาปัตยกรรม (ADR)

> แต่ละข้อมีสถานะ: ✅ ตัดสินแล้ว · 🟡 แนะนำ รอ PL ยืนยัน

### ADR-01 🟡 Monorepo เดียว (ไม่ใช่ 1 ระบบย่อย = 1 repo แบบ CSMJU2030)

- **เหตุผล:** CSMJU2030 แยก repo เพราะมีหลายทีมอิสระ · ที่นี่คนเดียว ต้องแชร์ `packages/ui` และ `packages/core`
  ข้ามทุกแอป — monorepo + Turborepo build เฉพาะที่เปลี่ยน, CI ชุดเดียว
- **ยังได้ความเป็นองค์กร:** CODEOWNERS ตาม path (`/apps/tarot/ @org/aie-tarot`) ให้สิทธิ์รายแอปได้เหมือน repo แยก
- **ทางออกในอนาคต:** แอปไหนโตจนต้องแยกทีม → `git subtree split --prefix=apps/<app>` เป็น repo ใหม่ได้
- **standards:** อยู่ใน `standards/` ของ monorepo ก่อน · แยกเป็น repo `<org>/standards` เมื่อมี repo ที่สองที่ต้องใช้

### ADR-02 🟡 Supabase เป็น backend กลาง (แทน NestJS + Prisma ของโปรเจกต์เดิม)

- **เหตุผล:** NestJS ต้องมี server รันตลอด — free tier (เช่น Render) หลับแล้ว cold start ~30–60 วินาที ทำลาย UX
  Supabase free ให้ Postgres + Auth + Realtime + Storage + Edge Functions ในที่เดียว
- **Database isolation แบบ CSMJU:** 1 project, **1 Postgres schema ต่อแอป** (`community`, `commerce`, …) + RLS
  — แอปหนึ่งแตะข้อมูลอีกแอปไม่ได้ ยกเว้นผ่าน view/RPC ที่ประกาศไว้
- **ราคาที่ต้องจ่าย:** logic ใน NestJS ของ canvas/nexus/toolboxes ต้องย้ายเป็น SQL (RLS, RPC) หรือ Edge Functions

### ADR-03 🟡 Supabase Auth เป็น SSO (แทน JWKS IdP ที่เขียนเองแบบ csmju-core-hub)

- PKCE flow ผ่าน `@supabase/ssr` · session อยู่ใน cookie ที่ตั้ง `domain=.<โดเมนของคุณ>` → ทุก subdomain ล็อกอินร่วมกัน
- **ต้องมีโดเมนของตัวเอง** — `*.pages.dev` / `*.vercel.app` อยู่ใน Public Suffix List แชร์ cookie ข้าม subdomain ไม่ได้
  (ทางเลือกงบ 0: ใช้ path แทน subdomain — `empire.pages.dev/tarot` ผ่าน Cloudflare Worker router)
- เก็บไว้เป็นจุดขาย: หน้า "Architecture Map" ใน hub อธิบายเทียบกับ JWKS ของ CSMJU2030 ที่คุณเคยทำ

### ADR-04 ✅ Next.js เฉพาะแอปที่ต้อง SEO, ที่เหลือ Vite SPA

- Next.js 15+: `hub`, `commerce`, `design` · Vite 6+: `community`, `toolboxes`, `tarot`, `canva`, `stream`
- ข้อยกเว้นชั่วคราว: แอปที่ dupe มาจาก Next.js รันเป็น Next ไปก่อนได้ ถ้าการย้ายเป็น Vite ยังไม่คุ้ม — บันทึกใน `standards/exceptions.yml` พร้อมวันหมดอายุ

### ADR-05 ✅ Hosting: Cloudflare Pages (หลัก) · Vercel Hobby (สำรองสำหรับ Next ที่ต้อง ISR)

- Cloudflare Pages: bandwidth ไม่จำกัด, ใช้เชิงพาณิชย์ได้ · Vercel Hobby ห้ามใช้เชิงพาณิชย์

### ADR-06 ✅ ข้อยกเว้น: CrocByte อยู่บน Firebase (2569-10-24)

- **ขอบเขต:** `apps/crocbyte` แอปเดียว ใช้ Firebase (Auth + Firestore + Storage, project `crocbyte-system`)
  ระบบย่อยอื่นทั้งหมดยังใช้ Supabase + SSO ของ Core Hub ตาม ADR-02/03
- **เหตุผล:** เป็นเว็บรับงานจริงของเจ้าของที่มีลูกค้า ยอดสะสม VIP และบัญชี Google อยู่แล้ว
  ย้ายฐานข้อมูลตอนนี้เสี่ยงข้อมูลหายมากกว่าประโยชน์ที่ได้
- **ที่ยังแชร์กับทุกระบบ:** ดีไซน์ (skill `crocwork-design`), ธีม/บรรยากาศ (cookie `em-theme`/`em-ambience`),
  `HubSwitcher` และลิงก์ `/go/crocbyte` จาก hub — ผู้ใช้เห็นเป็นระบบเดียวกัน แต่บัญชีแยกกัน
- **ตัวหลักของโค้ด:** monorepo (`apps/crocbyte`) — repo `Sarawut2005-icloud/Crocbyte` เดิมเลิกแก้แล้ว archive
- **กฎความปลอดภัย:** อยู่ใน repo (`apps/crocbyte/firestore.rules`, `storage.rules`) — สิทธิ์ต้องอยู่ที่กฎ ไม่ใช่แค่ในหน้าเว็บ
- **ทางออกในอนาคต:** ถ้าต้องการบัญชีเดียวข้ามระบบ ย้ายไป schema `crocbyte` บน Supabase แล้วจับคู่บัญชีด้วยอีเมล Google

---

## 4. Tech Stack

| ชั้น                  | เลือกใช้                                                              | หมายเหตุ                                                   |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Package manager       | **pnpm** (workspace, lockfile เข้มงวด)                                | `packageManager` ล็อกเวอร์ชันใน root `package.json`        |
| Build orchestrator    | **Turborepo**                                                         | local cache · remote cache เปิดเมื่อมี CI                  |
| ภาษา                  | **TypeScript 6.0** `strict`                                           | ล็อก `~6.0` — typescript-eslint ยังไม่รองรับ TS 7 (native) |
| SSR/SEO               | **Next.js 15+** (App Router, React 19)                                | hub · commerce · design                                    |
| SPA                   | **Vite 6+ + React 19**                                                | ที่เหลือ                                                   |
| UI                    | **Tailwind CSS v4 · shadcn/ui · Radix · Lucide**                      | token อยู่ที่ `packages/ui`                                |
| State                 | **Zustand** (client) · **TanStack Query v5** (server, optimistic)     |                                                            |
| Validation / Sanitize | **Zod** · **DOMPurify**                                               | ทุกขอบเขตข้อมูล                                            |
| Mobile                | **PWA** (manifest + Service Worker) · Capacitor 6 เมื่อจำเป็นจริง     |                                                            |
| Off-main-thread       | **Web Workers + Comlink**                                             |                                                            |
| Graphics              | **Fabric.js v6** / Pixi.js + **OffscreenCanvas**                      |                                                            |
| Local storage         | **IndexedDB ผ่าน Dexie.js**                                           | cache, offline, ไฟล์ใหญ่                                   |
| In-browser ML         | **Transformers.js v3 + WebGPU**                                       | fallback WASM เมื่อไม่มี WebGPU                            |
| Audio                 | **Web Audio API + Media Session API**                                 |                                                            |
| Backend               | **Supabase** (Postgres, RLS, Auth, Realtime, Storage, Edge Functions) |                                                            |
| Hosting               | **Cloudflare Pages** / Vercel Hobby                                   |                                                            |
| Test                  | **Vitest** · Testing Library · **Playwright** (e2e)                   | ตามโปรเจกต์เดิม                                            |

---

## 5. โครงสร้าง Monorepo

```text
software-empire/
├── apps/
│   ├── hub/          # Core Hub — SSO, Portfolio, Command Center, Architecture Map
│   ├── community/    # 1 · Discord-style realtime chat
│   ├── commerce/     # 2 · Freelance marketplace + simulated escrow
│   ├── toolboxes/    # 3 · Client-side dev tools + MCP Inspector
│   ├── tarot/        # 4 · AI tarot (WebGPU / 3D)
│   ├── design/       # 5 · Component & prompt registry
│   ├── canva/        # 6 · Canvas graphic editor
│   └── stream/       # 7 · Background audio player
├── packages/
│   ├── ui/           # design system (Tailwind v4 + shadcn)
│   ├── config/       # eslint · tsconfig · tailwind preset · prettier
│   └── core/         # supabase client, auth, zod schemas, SW helpers, worker bridge
├── supabase/
│   ├── migrations/   # SQL ทุกตาราง + RLS (แยก schema ต่อแอป)
│   └── functions/    # Edge Functions
├── standards/        # กฎ + สคริปต์ตรวจ (ย่อจาก csmju2030-standards)
├── docs/             # MASTER-SPEC, playbook, ADR
├── .github/          # workflows, CODEOWNERS, templates
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**ชื่อ package:** `@empire/ui`, `@empire/core`, `@empire/config` (scope เดียวกับชื่อ org จะดูเป็นมืออาชีพ)

**พอร์ต dev** (ไม่ชนกัน จำง่าย):

| app       | port |     | app    | port |
| --------- | ---- | --- | ------ | ---- |
| hub       | 3000 |     | tarot  | 3004 |
| community | 3001 |     | design | 3005 |
| commerce  | 3002 |     | canva  | 3006 |
| toolboxes | 3003 |     | stream | 3007 |

---

## 6. สเปกระบบย่อย

### 🏢 Core Hub — `apps/hub`

- **บทบาท:** ผู้ให้ SSO, หน้า portfolio/showroom, dashboard รวม, **Architecture Map** แบบ interactive
- **Tech:** Next.js 15, Supabase Auth (PKCE), Zustand
- **DoD:** ล็อกอินครั้งเดียวเข้าทุกแอปได้ · ทะเบียนระบบย่อย (ชื่อ, URL, สถานะ, health) แสดงจากตาราง `hub.subsystems`

### 💬 1 · Community — `apps/community`

- **บทบาท:** ห้องแชต, DM, presence, รากฐานห้องเสียง
- **Tech:** Vite + React 19, Supabase Realtime (Broadcast · Presence · Postgres Changes), Dexie cache
- **Security/Perf:** Zod ตรวจ payload ทุกข้อความ · optimistic send · ข้อความผ่าน DOMPurify ก่อน render

### 💼 2 · Commerce — `apps/commerce`

- **บทบาท:** แคตตาล็อกงานฟรีแลนซ์, ใบเสนอราคา, order, **escrow จำลอง** (state machine: `funded → delivered → released | disputed`)
- **Tech:** Next.js 15, TanStack Query (optimistic), Postgres RLS
- **Security:** RLS แยกผู้ซื้อ/ผู้ขาย · เงินเก็บเป็น `numeric`/สตางค์ (integer) ไม่ใช่ float · เปลี่ยนสถานะผ่าน RPC เท่านั้น

### 🛠️ 3 · Toolboxes & MCP Studio — `apps/toolboxes`

- **บทบาท:** JSON / Regex / JWT / Base64 / ฯลฯ + **MCP Inspector** (ต่อ MCP server แบบ HTTP แล้วดู tools/resources)
- **Tech:** Vite + React 19, Web Workers (Comlink), IndexedDB
- **Security:** ประมวลผล 100% ในเบราว์เซอร์ · ไม่ส่ง JSON/คีย์ของผู้ใช้ออก server

### 🔮 4 · AI Tarot — `apps/tarot`

- **บทบาท:** ไพ่ 3D + คำทำนายด้วย AI
- **Tech:** Vite + React 19, Three.js / CSS-3D, Transformers.js (WebGPU) หรือ BYOK
- **Security:** คีย์ BYOK อยู่ในเครื่องผู้ใช้เท่านั้น (ดูข้อจำกัดใน §7) · inference ใน Worker

### 🎨 5 · Design Registry — `apps/design`

- **บทบาท:** ดูตัวอย่าง component, copy โค้ด React/Tailwind, คลัง prompt (แนวเดียวกับ 21st.dev — ใช้ชื่อ/แบรนด์ของตัวเอง)
- **Tech:** Next.js 15, Shiki, DOMPurify
- **Security:** preview component ใน `<iframe sandbox="allow-scripts">` แยก origin — ห้าม `allow-same-origin` คู่กับ `allow-scripts`

### 🖌️ 6 · Canva — `apps/canva`

- **บทบาท:** editor กราฟิก vector/raster หลายเลเยอร์, เทมเพลต, export
- **Tech:** Vite + React 19, Fabric.js v6, OffscreenCanvas, Workers
- **Perf:** export และ filter ทำใน Worker · บันทึก state เป็น JSON (ต่อยอดจาก csmju-canvas)

### 🎵 7 · Stream — `apps/stream` (Peak UX Showcase)

- **บทบาท:** เครื่องเล่นเสียงที่เล่นต่อเมื่อปิดจอ, ควบคุมจาก lockscreen, เล่นออฟไลน์
- **Tech:** Vite + React 19, Web Audio API, Media Session API, Service Worker + Dexie
- **แหล่งเสียง (สำคัญ — ดู §12):** ไฟล์ของผู้ใช้เอง, podcast RSS, เพลงลิขสิทธิ์เปิด (เช่น Jamendo API), YouTube ผ่าน IFrame Player API ทางการ
  — ไม่ดึง stream ตรงจาก YouTube/Spotify และไม่ตัดโฆษณา

---

## 7. Security Shield

| ภัย                  | มาตรการ                                                                                                          | ตรวจด้วย                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| ข้อมูลรั่วข้ามผู้ใช้ | ทุกตารางเปิด RLS · policy `auth.uid() = user_id` · ไม่มี policy `using (true)` บนข้อมูลส่วนตัว                   | test SQL ใน `supabase/tests` + `standards` สแกน migration |
| ข้อมูลรั่วข้ามแอป    | schema แยกต่อแอป · role ไม่มีสิทธิ์ข้าม schema                                                                   | เหมือนข้างบน                                              |
| XSS                  | DOMPurify ทุก HTML/Markdown · CSP เข้ม (`script-src 'self'`, ไม่มี `unsafe-inline`) · iframe sandbox             | header test ใน e2e                                        |
| ขโมย session         | cookie `Secure; SameSite=Lax` ผ่าน `@supabase/ssr` · **ห้าม token ใน localStorage** (กฎเดียวกับ CSMJU SEC)       | grep ใน CI                                                |
| Payload ปลอม         | Zod ที่ form, API, Edge Function, และ `postMessage` ของ Worker                                                   | unit test                                                 |
| Secret หลุด          | `.env` อยู่ใน `.gitignore` · GitHub secret scanning + push protection · `service_role` key ไม่เคยอยู่ฝั่ง client | CI + GitHub                                               |
| Abuse                | debounce/throttle ฝั่ง client · Cloudflare rate-limit rule บน Edge Function                                      |                                                           |
| Dependency           | Dependabot alerts + `pnpm audit` ใน CI                                                                           | CI                                                        |

**ข้อจำกัดที่ต้องพูดตรง ๆ — BYOK:** คีย์ใน IndexedDB ปลอดภัยจาก server แต่ **ไม่ปลอดภัยจาก XSS** —
สคริปต์ใดที่รันบน origin เดียวกันอ่านได้ ลดความเสี่ยงด้วย CSP เข้ม + เข้ารหัสคีย์ด้วย passphrase ของผู้ใช้ (WebCrypto AES-GCM, PBKDF2)
และบอกผู้ใช้ให้ใช้คีย์ที่ตั้ง spending limit

---

## 8. Zero-Lag Performance

| เป้า                                       | วิธี                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| LCP < 0.8s (หน้า SSR) / < 1.5s (SPA, cold) | route-level code splitting, preload font, รูป AVIF/WebP               |
| Interaction < 100ms (INP)                  | งานหนักทั้งหมดใน Worker · optimistic UI                               |
| 60–120fps                                  | main thread ทำแค่ render · OffscreenCanvas สำหรับกราฟิก               |
| เปิดแอปทันที / ออฟไลน์                     | Service Worker cache shell + Dexie cache ข้อมูล                       |
| Bundle เล็ก                                | lazy load ของหนัก (Fabric, Three.js, Transformers.js) · ตรวจขนาดใน CI |

**Worker bridge มาตรฐาน** (อยู่ที่ `packages/core/worker`): ทุก Worker export API ผ่าน Comlink และตรวจ input ด้วย Zod
ที่ฝั่ง Worker — ไม่เชื่อข้อมูลจาก main thread แม้อยู่ origin เดียวกัน

---

## 9. MCP & AI Tooling

ตั้งไว้ใน `.mcp.json` ที่ root (Claude Code จะถามยืนยันครั้งแรกที่เปิดโปรเจกต์):

| Server                     | ใช้ทำอะไร                   | ต้องตั้งค่า                                      |
| -------------------------- | --------------------------- | ------------------------------------------------ |
| `github`                   | issue, PR, review, Actions  | env `GITHUB_PAT` (fine-grained) — ดู Playbook §2 |
| `memory`                   | knowledge graph ข้ามเซสชัน  | ไม่ต้อง · ไฟล์อยู่ `.claude/mcp-memory.jsonl`    |
| `filesystem`               | อ่าน/เขียนไฟล์ภายในโปรเจกต์ | ไม่ต้อง                                          |
| `supabase` _(เพิ่มทีหลัง)_ | ดู schema, รัน SQL, ดู RLS  | สร้าง Supabase project ก่อน                      |

**เพิ่ม Supabase MCP เมื่อพร้อม** (โหมด read-only + ผูก project เดียว เพื่อกัน AI แก้ prod):

```jsonc
"supabase": {
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest",
           "--read-only", "--project-ref=<project-ref>"],
  "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN:-}" }
}
```

> `@modelcontextprotocol/server-github` และ `server-postgres` ถูก deprecate บน npm แล้ว — จึงใช้ remote server ทางการของ GitHub และ Supabase MCP แทน

---

## 10. แผนนำโค้ดเดิมมาใช้ (Dupe Plan)

> หลักการ: **เอาตรรกะ ไม่เอาหน้าตา** — design ทำใหม่บน `packages/ui` ทั้งหมด

| ต้นทาง                | ปลายทาง          | เอามา                                                                 | ทิ้ง/เขียนใหม่                                                           |
| --------------------- | ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `csmju-canvas`        | `apps/canva`     | โครง JSON state ของงาน, ตรรกะ editor, เทมเพลต, test                   | NestJS+Prisma → Supabase (`canva` schema), SSO CSMJU → Supabase Auth, UI |
| `csmju-nexus`         | `apps/community` | ฟีด/แชต/ห้องเสียง, ตรรกะ realtime, migration ใน `supabase/`           | NestJS → RLS + Realtime, UI                                              |
| `csmju-toolboxes`     | `apps/toolboxes` | ตัว tools ฝั่ง frontend ทั้งหมด                                       | backend (ส่วนใหญ่ไม่จำเป็น — ทำ client-side)                             |
| `csmju-core-hub`      | `apps/hub`       | แนวคิด subsystem registry, rate-limit, error shape                    | JWKS IdP ที่เขียนเอง → Supabase Auth                                     |
| `csmju2030-standards` | `standards/`     | รูปแบบ rule ID (`SEC-01`…), CI job, rulesets, CODEOWNERS, PR template | กฎเฉพาะ MIS (รายชื่อคณะ, Core Hub registry)                              |

**ลำดับทำ dupe แต่ละตัว:**

1. คัดลอกเฉพาะ `src/` ที่เป็นตรรกะ + test ไปไว้ใน app ใหม่
2. ลบ import ที่ผูกกับ CSMJU (SSO, `standards/`, Core Hub client)
3. เขียน migration Supabase ใหม่จาก Prisma schema เดิม (snake_case เหมือนเดิม) + RLS
4. ทำ UI ใหม่ด้วย `packages/ui`
5. test เดิมต้องผ่านก่อน merge

---

## 11. Roadmap

| Phase                     | งาน                                                                                                                            | DoD                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| **0 · Foundation**        | ตั้ง GitHub org + repo + rulesets (Playbook) · scaffold pnpm/Turborepo · `packages/config` · CI (lint, typecheck, test, build) | PR แรกผ่าน CI และ merge ผ่าน ruleset       |
| **1 · Core**              | `packages/ui` (token, ปุ่ม, input, layout) · `packages/core` (Supabase client, auth, Worker bridge) · `apps/hub` ล็อกอินได้    | ล็อกอินที่ hub แล้ว session ใช้ได้         |
| **2 · Quick wins (dupe)** | `toolboxes` → `canva` → `community`                                                                                            | 3 แอปใช้ SSO เดียวกัน, deploy แล้ว         |
| **3 · Showcase**          | `stream` (PWA lockscreen) · `tarot` (WebGPU)                                                                                   | Lighthouse PWA ผ่าน, ทำงานบนมือถือ         |
| **4 · Data-heavy**        | `commerce` · `design`                                                                                                          | RLS test ครบ, escrow state machine มี test |
| **5 · Polish**            | Architecture Map, case study ต่อแอป, standards แยก repo (ถ้าจำเป็น)                                                            | portfolio พร้อมส่งสมัครงาน                 |

---

## 12. ความเสี่ยงที่ต้องรู้

| ความเสี่ยง                                                                                             | ผลกระทบ                                                                     | ทางแก้                                                                 |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Stream: ตัดโฆษณา/ดึง stream ตรงจาก YouTube·Spotify ผิดเงื่อนไขการใช้งาน** (YouTube ToS, Spotify DRM) | portfolio สาธารณะโดนแจ้งลบ, ภาพลักษณ์เสีย                                   | ใช้แหล่งเสียงถูกลิขสิทธิ์ตาม §6.7 — โชว์เทคนิคเดิมได้ครบ               |
| Supabase free **pause project เมื่อไม่มีการใช้งาน 7 วัน**                                              | ผู้สัมภาษณ์เปิดแล้วเจอ error                                                | ตั้ง GitHub Actions cron ping ทุก 3 วัน · หน้า hub แสดง fallback สวย ๆ |
| Supabase free มีได้ **2 project** และ DB 500 MB                                                        | แยก dev/prod ได้แค่นี้                                                      | ใช้ 1 project ทุกแอป (ADR-02) + Supabase CLI local สำหรับ dev          |
| SSO ข้าม subdomain ต้องมีโดเมนเอง                                                                      | ไม่ใช่งบ 0 จริง (~300–400 บาท/ปี)                                           | หรือใช้ path routing (ADR-03)                                          |
| GitHub ไม่ให้ approve PR ของตัวเอง                                                                     | ruleset แบบ CSMJU (`required_approving_review_count: 1`) ทำให้ merge ไม่ได้ | ตั้งเป็น 0 ตอนทำคนเดียว ดู Playbook §5                                 |
| ขอบเขตใหญ่ 8 แอป                                                                                       | ไม่เสร็จสักตัว                                                              | ทำตาม Roadmap — แอปที่เสร็จ 3 ตัวดีกว่าครึ่งทาง 8 ตัว                  |
