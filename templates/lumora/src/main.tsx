import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/noto-sans-thai';
import '@fontsource/bebas-neue';
import './index.css';
import { brand } from './brand.config';
import App from './App';

// Push brand colours/fonts into CSS variables used by the Tailwind theme.
const root = document.documentElement.style;
root.setProperty('--brand-accent', brand.colors.accent);
root.setProperty('--brand-accent-hover', brand.colors.accentHover);
root.setProperty('--brand-app-bg', brand.colors.appBackground);
root.setProperty('--brand-font-sans', brand.fonts.sans);
root.setProperty('--brand-font-display', brand.fonts.display);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
