import { useState } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../brand.config';
import { I } from '../components/Icons';

const links: [string, string][] = [
  [brand.company, '/legal/terms/'], ['About', '/legal/terms/'], ['Blog', '/legal/terms/'], ['Jobs', '/legal/terms/'],
  ['Help', '/legal/terms/'], ['API', '/legal/terms/'], ['Privacy', '/legal/privacy/'], ['Terms', '/legal/terms/'],
  ['Locations', '/explore'], ['Popular', '/explore'], [`${brand.name} Lite`, '/'], [`${brand.company} AI`, '/legal/terms/'],
  ['Studio', '/legal/terms/'], ['Circles', '/legal/terms/'], ['Contact Uploading & Non-Users', '/legal/privacy/'], [`${brand.company} Verified`, '/legal/terms/'],
];
const languages = ['English', 'ภาษาไทย', 'Español', 'Français', 'Deutsch', '日本語', '한국어', 'Bahasa Indonesia', 'Português (Brasil)', 'Tiếng Việt'];

export function PublicFooter({ compact }: { compact?: boolean }) {
  const [lang, setLang] = useState(languages[0]);
  return (
    <footer className={`pub-footer ${compact ? 'compact' : ''}`}>
      <nav className="pub-footer-links" aria-label="Footer">
        {(compact ? links.filter((_, i) => i < 11 || i > 13) : links).map(([t, to]) => (
          <Link key={t} to={to}>{t}</Link>
        ))}
      </nav>
      <div className="pub-footer-meta">
        <label className="lang">
          <span>{lang}</span>
          <I.ChevronDown size={12} strokeWidth={1.5} />
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Switch display language">
            {languages.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <span>© {brand.year} {brand.name} from {brand.company}</span>
      </div>
    </footer>
  );
}
