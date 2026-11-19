# Motion Bits

คลังคอมโพเนนต์เคลื่อนไหว ปรับค่าสด คัดลอกโค้ด TS/JS เก็บรายการโปรด

A crocwork template, inspired by [React Bits](https://reactbits.dev). Live preview: the Templates page of the crocwork Design Registry.

Built clean-room from what a visitor sees: no React Bits source code was read, copied or ported.
The ten components in `src/components/reactbits` are our own implementations. React Bits and its
name belong to their owner; this template is not made by, endorsed by or connected to them. You may
copy it, change it and use it in your own projects.

## Run it

```sh
npm ci
npm run dev
```

`npm run build` writes a static site to `out/`. Set `TEMPLATE_BASE=/some/path` before the build to
serve it under a sub-path (that is how the preview runs under `/tpl/motion-bits`). Both commands
first run `scripts/gen-sources.mjs`, which writes the code shown in each component's Code tab.
