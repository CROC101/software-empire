import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme } from './brand.config';
import { useStore } from './store';
import './styles/base.css';
import './styles/public.css';
import './styles/app.css';

const dark = matchMedia('(prefers-color-scheme: dark)');
const sync = () => {
  const t = useStore.getState().theme;
  applyTheme(t === 'system' ? (dark.matches ? 'dark' : 'light') : t);
};
sync();
useStore.subscribe((s, prev) => s.theme !== prev.theme && sync());
dark.addEventListener('change', sync);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
