import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { I } from '../components/Icons';
import { Field } from './Login';
import { PublicFooter } from './PublicFooter';

export function PasswordReset() {
  const [v, setV] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!v.trim()) return setErr('Enter your mobile number, username or email.');
    setErr('');
    setSent(true);
  };
  return (
    <div className="flow-page">
      <main className="flow-col reset">
        <button className="back" onClick={() => nav(-1)} aria-label="Back"><I.ChevronLeft size={24} strokeWidth={1.6} /></button>
        {sent ? (
          <>
            <h1 className="flow-title">Check your inbox</h1>
            <p className="flow-text">If an account matches <b>{v}</b>, we sent a link to get back into it.</p>
            <Link className="pill pill-primary w100 mt" to="/">Back to log in</Link>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="flow-title">Find your account</h1>
            <p className="flow-text">
              Enter your mobile number, username or email. <Link className="strong-link" to="/legal/terms/">Can't reset your password?</Link>
            </p>
            <Field label="Mobile number, username or email" value={v} onChange={setV} autoComplete="username" />
            <p className="flow-note">You may receive chat app and SMS notifications from us for security and login purposes.</p>
            {err && <p className="form-error" role="alert">{err}</p>}
            <button className="pill pill-primary w100" type="submit">Continue</button>
          </form>
        )}
      </main>
      <PublicFooter compact />
    </div>
  );
}
