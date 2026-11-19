/** @type {import('next').NextConfig} */
const nextConfig = {
  // set by apps/design/tools/templates.mjs so the build can live under /templates/<slug>
  basePath: process.env.TEMPLATE_BASE || '',
  env: { TEMPLATE_BASE: process.env.TEMPLATE_BASE || '' },
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
