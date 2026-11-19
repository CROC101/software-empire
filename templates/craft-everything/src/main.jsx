import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400-italic.css';
import './styles.css';
import { theme } from './brand.js';
import { Header, Footer, Ruler, Spy } from './components/ui.jsx';
import { Home, Apps, AppDetail, Simple } from './pages/main.jsx';
import Studio from './pages/Studio.jsx';
import Pricing from './pages/Pricing.jsx';
import Support from './pages/Support.jsx';

// Brand tokens -> CSS variables (light + dark), so styles.css never hard-codes the palette.
const css = (t) => Object.entries(t).map(([k, v]) => `--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`).join(';');
const f = theme.fonts;
document.head.insertAdjacentHTML('beforeend', `<style>:root{${css(theme.light)};--font-display:${f.display};--font-body:${f.body};--font-mono:${f.mono};--font-serif:${f.serif}}:root[data-theme=dark]{${css(theme.dark)}}</style>`);

function Shell() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <div style={{ position: 'relative' }}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/apps/:slug" element={<AppDetail />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Simple />} />
        </Routes>
      </main>
      <Footer />
      <Ruler />
      <Spy />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell /></BrowserRouter>);

