# 🧭 GitHub Org Playbook — คนเดียวเป็น PM · PL · AIE และพร้อมรับทีมในอนาคต

> ย่อส่วนจาก `csmju2030-standards/org-settings` ให้เหมาะกับเจ้าของคนเดียว
> ทุกขั้นทำบน **GitHub Free** ได้ · แทน `ORG` ด้วยชื่อ org จริงทุกที่ (ใน `.github/CODEOWNERS` ด้วย)

---

## 0. ภาพรวมสิ่งที่จะได้

```text
github.com/ORG                       ← Organization (ฟรี) — คุณเป็น Owner
├── team: pm        (Maintain)       ← หมวก PM
├── team: pl        (Maintain)       ← หมวก PL · CODEOWNER ของ ui/standards
├── team: aie       (Write)          ← หมวก AIE
│   └── aie-<app>   (ย่อยต่อแอป — สร้างเมื่อมีคนมาช่วย)
└── repo: software-empire (public)   ← monorepo · ruleset ป้องกัน main
    ├── .github/CODEOWNERS           ← ใคร review path ไหน
    ├── .github/pull_request_template.md  ← checklist ของ PL
    └── .github/ISSUE_TEMPLATE/      ← แบบฟอร์มของ PM
```

ตอนนี้คุณอยู่ทุกทีม · วันที่มีคนเข้ามา แค่เชิญเข้าทีมที่ตรงบทบาท — ไม่ต้องแก้โครงสร้าง

---

## 1. สร้าง Organization

1. github.com → รูปโปรไฟล์ → **Your organizations** → **New organization** → **Free**
2. ตั้งชื่อเป็นแบรนด์ (เช่น `<ชื่อคุณ>-labs`, `empire-studio`) — ชื่อนี้จะเป็น scope `@ORG/...` และอยู่ใน URL portfolio
3. ใส่ logo, คำอธิบาย, เว็บไซต์ → org ดูเป็นบริษัททันที
4. สร้าง repo `.github` ใน org แล้วใส่ `profile/README.md` → กลายเป็นหน้าแรกของ org (โชว์ 8 ระบบ + Architecture Map)

> ทำไมต้อง org ไม่ใช่บัญชีส่วนตัว: มี **teams** (จำเป็นต่อ CODEOWNERS แบบบทบาท), โอนสิทธิ์ให้คนอื่นได้, ดูเป็นองค์กรจริง

---

## 2. ติดตั้งเครื่องมือในเครื่อง

```powershell
winget install GitHub.cli          # ยังไม่มี gh ในเครื่องนี้
gh auth login                      # เลือก GitHub.com → HTTPS → browser
gh auth refresh -s admin:org       # สิทธิ์จัดการ teams/org
```

**Token ให้ GitHub MCP** (`.mcp.json` อ่านจาก env `GITHUB_PAT`):

1. Settings → Developer settings → **Fine-grained tokens** → Generate
2. Resource owner = `ORG` · Repository access = เฉพาะ `software-empire` · ตั้งวันหมดอายุ (90 วัน)
3. Permissions: Contents RW, Issues RW, Pull requests RW, Actions R, Metadata R
4. ตั้งเป็น env ของผู้ใช้ แล้ว **ปิด-เปิด terminal ใหม่** ก่อนรัน `claude`:

```powershell
setx GITHUB_PAT "github_pat_xxx"
```

> อย่าใส่ token ลงไฟล์ใด ๆ ใน repo · ถ้าหลุดให้ revoke ทันทีที่หน้าเดียวกัน

---

## 3. สร้าง repo แล้ว push ครั้งแรก

```powershell
cd D:\projects\software-empire
git init -b main
git add .
git commit -m "chore: initial project docs and MCP config"
gh repo create ORG/software-empire --public --source . --push
```

> **Public** เพราะ (1) เป็น portfolio (2) Rulesets, secret scanning, push protection บน **private repo ต้องใช้แผน Team** — public ได้ฟรีทั้งหมด
> `.gitignore` กันโฟลเดอร์อ้างอิงภาษาไทยทั้งสองไว้แล้ว — ตรวจด้วย `git status` ก่อน commit ว่าไม่มีโค้ด CSMJU หลุดเข้าไป

---

## 4. Teams = บทบาท

```powershell
gh api orgs/ORG/teams -f name=pm  -f privacy=closed -f description="Product Manager — backlog & DoD"
gh api orgs/ORG/teams -f name=pl  -f privacy=closed -f description="Product Leader — quality gate & design system"
gh api orgs/ORG/teams -f name=aie -f privacy=closed -f description="AI Engineer — implementation"

# ผูกสิทธิ์ team เข้า repo (CODEOWNERS ใช้ team ได้ก็ต่อเมื่อ team มีสิทธิ์ write ขึ้นไป)
gh api -X PUT orgs/ORG/teams/pm/repos/ORG/software-empire  -f permission=maintain
gh api -X PUT orgs/ORG/teams/pl/repos/ORG/software-empire  -f permission=maintain
gh api -X PUT orgs/ORG/teams/aie/repos/ORG/software-empire -f permission=push
```

ผู้สร้าง team เป็นสมาชิกอัตโนมัติ — คุณอยู่ครบทั้ง 3 ทีมแล้ว

**Org settings** (Settings → Member privileges) ตั้งแบบ CSMJU2030:

| Setting                                  | ค่า                      |
| ---------------------------------------- | ------------------------ |
| Base permissions                         | Read                     |
| Members can create / delete repositories | ❌                       |
| Members can change repo visibility       | ❌                       |
| Require 2FA                              | ✅ (เปิดให้ตัวเองก่อน)   |
| Actions → Workflow permissions           | Read repository contents |
| Allow GitHub Actions to approve PRs      | ❌                       |

---

## 5. Ruleset ป้องกัน `main` (โหมดคนเดียว)

**กับดัก:** GitHub **ไม่ให้ approve PR ของตัวเอง** — ถ้าลอก ruleset ของ CSMJU (`required_approving_review_count: 1`) จะ merge อะไรไม่ได้เลย
โหมดคนเดียวจึงบังคับ "ต้องผ่าน PR + CI เขียว" แต่จำนวน approve = 0 · ตัว PL review ผ่าน checklist ใน PR template

```powershell
gh api -X POST repos/ORG/software-empire/rulesets --input standards/org-settings/ruleset-main-solo.json
```

ไฟล์อยู่ที่ [`standards/org-settings/ruleset-main-solo.json`](../standards/org-settings/ruleset-main-solo.json) — กันลบ `main`, กัน force-push, บังคับ PR, บังคับ resolve ทุก thread

ruleset นี้บังคับ check `verify` (job ใน `.github/workflows/ci.yml`) ด้วย — ถ้าเปลี่ยนชื่อ job ต้องแก้ ruleset ตามทันที ไม่งั้น check ที่ไม่มีวันรันจะล็อก main ถาวร

**Repo settings → General → Pull Requests:** เปิดแค่ **Squash merge** · เปิด "Automatically delete head branches"

> squash แล้ว branch เดิมจะดู "ยังไม่ merge" ใน git ในเครื่อง — ลบ branch ด้วย `git branch -D` หลัง PR merge

---

## 6. CODEOWNERS = ใครคุมอะไร

ไฟล์ [`.github/CODEOWNERS`](../.github/CODEOWNERS) — ตอนนี้ทุกบรรทัดชี้ team ที่คุณอยู่ จึงไม่ติดอะไร
วันที่มีคนมาทำ `tarot` ให้สร้าง team `aie-tarot` แล้วเปลี่ยนบรรทัดเดียว:

```text
/apps/tarot/   @ORG/aie-tarot @ORG/pl
```

---

## 7. Workflow ประจำวัน (ใส่หมวกตามลำดับ)

```text
🎯 PM   gh issue create --template feature.yml        ← เขียน acceptance criteria ก่อน
🤖 AIE  git checkout -b feature/<app>/<เรื่อง>
        ...เขียนโค้ดกับ Claude...
        git commit -m "feat(<app>): <อะไร>"
        gh pr create --fill                           ← body มี "Closes #<issue>"
👑 PL   ไล่ checklist ใน PR → แก้จนครบ → Squash merge
```

| สิ่งที่ต้องตรงรูปแบบ | รูปแบบ                                                                                | ตัวอย่าง                                   |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| Branch               | `feature\|fix\|chore\|docs/<app>/<kebab>`                                             | `feature/tarot/webgpu-fallback`            |
| Commit               | Conventional Commits, scope = ชื่อ app/package                                        | `fix(core): refresh session before expiry` |
| `<app>`              | `hub community commerce toolboxes tarot design canva stream ui core config standards` |                                            |

**ระบบ PM บน GitHub:**

- **Projects** (org level) → สร้าง board `Empire Roadmap` คอลัมน์ `Backlog → Ready → In progress → Review → Done`
- **Milestones** = Phase ใน MASTER-SPEC §11
- **Labels**: `app:<ชื่อ>`, `type:feature|bug|chore`, `priority:p0|p1|p2`

```powershell
foreach ($a in "hub","community","commerce","toolboxes","tarot","design","canva","stream") { gh label create "app:$a" -R ORG/software-empire -c 1D76DB }
foreach ($p in "p0","p1","p2") { gh label create "priority:$p" -R ORG/software-empire -c B60205 }
```

---

## 8. Security (ฟรีบน public repo)

Settings → **Code security** → เปิด: Secret scanning · **Push protection** · Dependabot alerts · Dependabot security updates · CodeQL (default setup)

---

## 9. วันที่ "องค์กร" มีคนเข้ามา

| ขั้น | ทำอะไร                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | เชิญเข้า org แบบ Member (base = Read) แล้วเข้าทีมตามบทบาท                                                                                                     |
| 2    | สร้าง `aie-<app>` / `pl-<app>` ถ้าแบ่งตามแอป แล้วแก้ CODEOWNERS                                                                                               |
| 3    | เปลี่ยน ruleset: `required_approving_review_count: 1`, `require_code_owner_review: true`, `require_last_push_approval: true` — ตอนนี้มีคนอื่น approve ได้แล้ว |
| 4    | ใส่ตัวเองใน `bypass_actors` แบบ `pull_request` ไว้สำหรับเหตุฉุกเฉิน                                                                                           |
| 5    | แอปที่ทีมโตจนอยากแยก repo → `git subtree split --prefix=apps/<app> -b split/<app>` แล้ว push เป็น repo ใหม่ใน org                                             |

---

## 10. Checklist ตั้งค่าครั้งแรก

- [ ] สร้าง org + profile README
- [ ] `gh` ติดตั้งและล็อกอิน · ตั้ง `GITHUB_PAT` · เปิด `claude` ใหม่แล้ว `/mcp` เห็น `github` connected
- [ ] แทน `ORG` ใน `.github/CODEOWNERS`
- [ ] สร้าง repo + push ครั้งแรก
- [ ] สร้าง teams pm/pl/aie + ผูกสิทธิ์
- [ ] ตั้ง org member privileges
- [ ] ใส่ ruleset `main` (โหมดคนเดียว) · เปิดแค่ squash merge
- [ ] เปิด secret scanning + push protection + Dependabot
- [ ] สร้าง labels, milestones (Phase 0–5), Project board
- [ ] เปิด issue แรก: "Phase 0 · scaffold monorepo"
