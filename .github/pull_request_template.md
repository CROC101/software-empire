## อะไร / ทำไม

Closes #

## 🤖 AIE — ผู้ทำ

- [ ] ทำครบ acceptance criteria ใน issue
- [ ] มี test ของ logic ใหม่ (branch, parser, เงิน, security)
- [ ] `pnpm format:check && pnpm verify` ผ่านในเครื่อง

## 👑 PL — Quality gate

- [ ] UI ใช้ component/token จาก `packages/ui` ไม่มีสีหรือระยะดิบ
- [ ] ใช้งานได้บนมือถือ (360px) และ desktop · keyboard + screen reader ใช้ได้
- [ ] งานหนักไม่อยู่บน main thread (Worker + Comlink)
- [ ] ตารางใหม่เปิด RLS และมี test policy
- [ ] input ใหม่ผ่าน Zod · HTML/Markdown ของผู้ใช้ผ่าน DOMPurify
- [ ] ไม่มี secret, token ใน localStorage, หรือบริการเสียเงินใหม่
- [ ] ถ้าขัด ADR ใน `docs/MASTER-SPEC.md` — อัปเดต ADR ใน PR นี้แล้ว

## ภาพหน้าจอ (ถ้ามี UI)
