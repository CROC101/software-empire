# Software Empire

Enterprise-style portfolio: one Core Hub (SSO) + seven client-side-first subsystems on a single pnpm + Turborepo monorepo, run at zero infrastructure cost.

- Spec, architecture decisions, roadmap: [`docs/MASTER-SPEC.md`](docs/MASTER-SPEC.md)
- GitHub org, teams, rulesets: [`docs/GITHUB-ORG-PLAYBOOK.md`](docs/GITHUB-ORG-PLAYBOOK.md)

## Develop

Requires Node 24 and pnpm 12.

```sh
pnpm install
pnpm verify        # lint + typecheck + test + build
pnpm format:check
```

| Path              | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `apps/*`          | Hub and subsystems (from Phase 1)             |
| `packages/config` | Shared ESLint (type-aware) and tsconfig bases |
| `standards/`      | Repo rules and GitHub org settings            |
| `.github/`        | CI, CODEOWNERS, PR and issue templates        |
