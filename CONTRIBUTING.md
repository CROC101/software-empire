# Contributing

Thanks for helping. This is a solo-maintained monorepo, so small, focused PRs get merged fastest.

## Before you start

- Bugs and ideas: open an issue first, using a template.
- Security problems: do **not** open an issue. Follow [SECURITY.md](SECURITY.md).

## Setup

Requires Node 24 and pnpm 12.

```sh
pnpm install
pnpm dev
```

Local Supabase (for apps that need data): `supabase start`, then copy each app's `.env.example`.

## Making a change

1. Branch from `main`: `feature/<app>/<topic>` or `fix/<app>/<topic>`.
2. Keep the change to one app or package where you can.
3. Use components and tokens from `packages/ui`. No raw colors or spacing.
4. New logic (branches, parsers, money, security) needs a test.
5. New tables need RLS and a pgTAP policy test in `supabase/tests`.
6. Validate input with Zod. Sanitize user HTML/Markdown with DOMPurify.
7. Never commit secrets. Never store tokens in `localStorage`.

Run before you push:

```sh
pnpm format:check && pnpm verify
```

## Commits and PRs

- [Conventional Commits](https://www.conventionalcommits.org): `feat(hub): ...`, `fix(toolboxes): ...`, `docs: ...`.
- Fill in the PR template. Add screenshots for UI changes (mobile 360px and desktop).
- `main` is protected: a PR needs the `verify` check green and all review threads resolved.
- If your change goes against an ADR in `docs/MASTER-SPEC.md`, update the ADR in the same PR.

## License

By contributing, you agree your work is released under the [MIT License](LICENSE).
