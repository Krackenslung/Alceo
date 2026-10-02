import { useState } from 'react';
import { post } from '../api/client.js';

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  const edit = (patch) => {
    setError('');
    setForm((f) => ({ ...f, ...patch }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (register && form.password.length < 8) return setError('Use at least 8 characters for your password.');
    setBusy(true);
    try {
      const body = register ? form : { email: form.email, password: form.password };
      onAuthed(await post(register ? '/auth/register' : '/auth/login', body));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="signedout">
      <form className="panel auth" onSubmit={submit}>
        <div className="logo">
          <span className="logo__mark">A</span>
          <span className="logo__text">Alceo</span>
        </div>
        <div>
          <h1 className="auth__title">{register ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted">{register ? 'Log workouts and let AI plan the next one.' : 'Sign in to continue training.'}</p>
        </div>
        {register && (
          <label className="pfield">
            <span className="pfield__label">Name</span>
            <input autoComplete="name" required maxLength={100} value={form.name} onChange={(e) => edit({ name: e.target.value })} />
          </label>
        )}
        <label className="pfield">
          <span className="pfield__label">Email</span>
          <input type="email" autoComplete="email" required maxLength={255} value={form.email} onChange={(e) => edit({ email: e.target.value })} />
        </label>
        <label className="pfield">
          <span className="pfield__label">Password</span>
          <input
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            maxLength={128}
            value={form.password}
            onChange={(e) => edit({ password: e.target.value })}
          />
        </label>
        {error && <p className="neg">{error}</p>}
        <button className="btn btn--lime auth__submit" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
        </button>
        <p className="muted auth__switch">
          {register ? 'Already have an account?' : 'New to Alceo?'}{' '}
          <button type="button" className="link" onClick={() => { setMode(register ? 'login' : 'register'); setError(''); }}>
            {register ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </div>
  );
}
