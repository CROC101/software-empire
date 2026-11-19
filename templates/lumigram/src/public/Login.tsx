import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brand } from '../brand.config';
import { SocialBadge } from '../components/Icons';
import { CompanyMark, LogoMark } from '../components/ui';
import { useStore } from '../store';
import { HeroArt } from './HeroArt';
import { PublicFooter } from './PublicFooter';

export function Field({ label, type = 'text', value, onChange, autoComplete }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';
  return (
    <label className={`field ${value ? 'filled' : ''}`}>
      <span className="field-label">{label}</span>
      <input type={isPw && show ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-label={label} />
      {isPw && value && (
        <button type="button" className="field-toggle" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
      )}
    </label>
  );
}

export function Login() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const login = useStore((s) => s.login);
  const nav = useNavigate();
  const ready = user.trim().length > 0 && pass.length >= 6;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return setError('Enter your username and a password of at least 6 characters.');
    setBusy(true);
    setTimeout(() => {
      login(user);
      nav('/', { replace: true });
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-split">
        <section className="login-banner" role="banner">
          <Link to="/" className="login-logo" aria-label={brand.name}><LogoMark size={60} /></Link>
          <h1 className="login-headline">
            {brand.tagline.lead} <span className="grad-text">{brand.tagline.highlight}</span>.
          </h1>
          <HeroArt />
        </section>
        <header className="login-top">
          <LogoMark size={60} />
        </header>
        <main className="login-main">
          <form className="login-form" onSubmit={submit} noValidate>
            <h2 className="login-title">Log into {brand.name}</h2>
            <Field label="Mobile number, username or email" value={user} onChange={setUser} autoComplete="username" />
            <Field label="Password" type="password" value={pass} onChange={setPass} autoComplete="current-password" />
            <button className="pill pill-primary login-submit" disabled={!ready || busy} type="submit">
              {busy ? <span className="spinner small light" /> : 'Log in'}
            </button>
            {error && <p className="form-error" role="alert">{error}</p>}
            <Link className="pill pill-link" to="/accounts/password/reset/">Forgot password?</Link>
            <button type="button" className="pill pill-gray login-social" onClick={() => { login('you'); nav('/'); }}>
              <SocialBadge /> Log in with {brand.company}
            </button>
            <Link className="pill pill-outline" to="/accounts/emailsignup/">Create new account</Link>
            <div className="login-company"><CompanyMark /></div>
          </form>
        </main>
      </div>
      <PublicFooter />
    </div>
  );
}
