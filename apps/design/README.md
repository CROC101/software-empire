# @empire/design — Design Registry

Live, tweakable motion components in the crocwork style. Each part blends two or three classic
patterns (aurora backgrounds, text scramble and reveal, tilt and spotlight cards, pixel
transitions, click sparks, particle constellations, border beams, magnifying docks, morphing
status islands, bento metrics, marquees) and is rebuilt from scratch on `@empire/ui` tokens.

- `src/registry/meta.ts` — metadata, playground controls, rebuild prompts (plain data, tested)
- `src/registry/<slug>.tsx` — one component per file; the Code tab shows this file as-is
- `src/registry/parts.tsx` — slug → component map

Rules: transform / opacity only, `motion/react`, reduced motion respected (MotionConfig + `useReducedMotionAfterMount`),
canvas colours from `useTokenColors`, moving layers carry `vt-live`.

```
pnpm --filter @empire/design dev    # http://localhost:3005
pnpm --filter @empire/design build  # static export to out/
```

Credit: the layout idea (registry grid, command search, copy prompt) and the effect families are
inspired by the public patterns of the React Bits (MIT) and 21st.dev community libraries. No code,
names or assets were copied; every component here is our own.
