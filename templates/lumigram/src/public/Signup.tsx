import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brand } from '../brand.config';
import { I } from '../components/Icons';
import { CompanyMark } from '../components/ui';
import { useStore } from '../store';
import { Field } from './Login';
import { PublicFooter } from './PublicFooter';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const thisYear = new Date().getFullYear();

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="select">
      <span className={value ? '' : 'placeholder'}>{value || label}</span>
      <I.ChevronDown size={24} strokeWidth={2} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        <option value="">{label}</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function Signup() {
  const [f, setF] = useState({ contact: '', password: '', month: '', day: '', year: '', name: '', username: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const login = useStore((s) => s.login);
  const updateProfile = useStore((s) => s.updateProfile);
  const nav = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!f.contact.trim()) errs.push('Enter a mobile number or email.');
    if (f.password.length < 6) errs.push('Use a password with at least 6 characters.');
    if (!f.month || !f.day || !f.year) errs.push('Enter your birthday.');
    if (!f.username.trim()) errs.push('Choose a username.');
    setErrors(errs);
    if (errs.length) return;
    login(f.username);
    if (f.name.trim()) updateProfile({ name: f.name.trim() });
    nav('/', { replace: true });
  };

  return (
    <div className="flow-page">
      <main className="flow-col signup">
        <button className="back" onClick={() => nav(-1)} aria-label="Back"><I.ChevronLeft size={24} strokeWidth={1.6} /></button>
        <div className="signup-mark"><CompanyMark /></div>
        <h1 className="flow-title">Get started on {brand.name} with a {brand.company} Account</h1>
        <p className="flow-text">A {brand.company} Account lets you use several {brand.company} apps, like {brand.name}, easily and securely.</p>
        <form onSubmit={submit} noValidate>
          <h2 className="flow-label">Mobile number or email</h2>
          <Field label="Mobile number or email" value={f.contact} onChange={set('contact')} autoComplete="email" />
          <p className="flow-text sm-gap">You may receive notifications from us. <Link className="strong-link" to="/legal/privacy/">Learn why we ask for your contact information</Link></p>
          <h2 className="flow-label">Password</h2>
          <Field label="Password" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
          <h2 className="flow-label">Birthday <I.Help size={20} strokeWidth={1.6} /></h2>
          <div className="bday">
            <Select label="Month" value={f.month} onChange={set('month')} options={months} />
            <Select label="Day" value={f.day} onChange={set('day')} options={Array.from({ length: 31 }, (_, i) => String(i + 1))} />
            <Select label="Year" value={f.year} onChange={set('year')} options={Array.from({ length: 100 }, (_, i) => String(thisYear - i))} />
          </div>
          <h2 className="flow-label">Name</h2>
          <Field label="Full name" value={f.name} onChange={set('name')} autoComplete="name" />
          <h2 className="flow-label">Username</h2>
          <Field label="Username" value={f.username} onChange={set('username')} autoComplete="username" />
          <p className="flow-text mt">People who use our service may have uploaded your contact information to {brand.name}. <Link className="strong-link" to="/legal/privacy/">Learn more</Link>.</p>
          <p className="flow-text">By tapping Submit, you agree to create an account and to {brand.name}'s <Link className="strong-link" to="/legal/terms/">Terms</Link>, <Link className="strong-link" to="/legal/privacy/">Privacy Policy</Link> and <Link className="strong-link" to="/legal/privacy/">Cookies Policy</Link>.</p>
          <p className="flow-text">The <Link className="strong-link" to="/legal/privacy/">Privacy Policy</Link> describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products.</p>
          {errors.length > 0 && <ul className="form-error" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <button className="pill pill-primary w100 mt" type="submit">Submit</button>
          <Link className="pill pill-gray w100" to="/">I already have an account</Link>
        </form>
      </main>
      <PublicFooter compact />
    </div>
  );
}
