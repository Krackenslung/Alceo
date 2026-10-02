import { useState } from 'react';
import { patch, post } from '../api/client.js';
import { displayToCm, displayToKg, heightUnit, round } from '../lib/units.js';

export default function Onboarding({ user, units, onDone, onSignOut }) {
  const [form, setForm] = useState({ name: user.name, sex: '', date_of_birth: '', height: '', weight: '', body_fat_pct: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const edit = (p) => {
    setError('');
    setForm((f) => ({ ...f, ...p }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        name: form.name.trim(),
        sex: form.sex,
        date_of_birth: form.date_of_birth,
        height_cm: displayToCm(form.height, units),
        weight_kg: displayToKg(form.weight, units),
      };
      if (form.body_fat_pct !== '') body.body_fat_pct = round(Number(form.body_fat_pct), 1);
      const updated = await patch('/users/me', body);
      // The age gate can block the account as soon as the date of birth is saved.
      onDone(updated.status === 'blocked' ? updated : await post('/users/me/complete-onboarding'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signedout">
      <form className="panel auth auth--wide" onSubmit={submit}>
        <div>
          <h1 className="auth__title">Set up your profile</h1>
          <p className="muted">The AI uses this to size your workouts. You can change it later.</p>
        </div>
        <div className="pgrid">
          <label className="pfield pgrid__full">
            <span className="pfield__label">Name</span>
            <input required maxLength={100} value={form.name} onChange={(e) => edit({ name: e.target.value })} />
          </label>
          <label className="pfield">
            <span className="pfield__label">Sex</span>
            <select required value={form.sex} onChange={(e) => edit({ sex: e.target.value })}>
              <option value="" disabled>Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="pfield">
            <span className="pfield__label">Date of birth</span>
            <input type="date" required value={form.date_of_birth} onChange={(e) => edit({ date_of_birth: e.target.value })} />
          </label>
          <label className="pfield">
            <span className="pfield__label">Height</span>
            <div className="unit">
              <input inputMode="decimal" required type="number" step="0.1" min="1" value={form.height} onChange={(e) => edit({ height: e.target.value })} />
              <span>{heightUnit(units)}</span>
            </div>
          </label>
          <label className="pfield">
            <span className="pfield__label">Weight</span>
            <div className="unit">
              <input inputMode="decimal" required type="number" step="0.1" min="1" value={form.weight} onChange={(e) => edit({ weight: e.target.value })} />
              <span>{units}</span>
            </div>
          </label>
          <label className="pfield">
            <span className="pfield__label">Body fat (optional)</span>
            <div className="unit">
              <input inputMode="decimal" type="number" step="0.1" min="0" max="100" value={form.body_fat_pct} onChange={(e) => edit({ body_fat_pct: e.target.value })} />
              <span>%</span>
            </div>
          </label>
        </div>
        {error && <p className="neg">{error}</p>}
        <div className="auth__row">
          <button type="button" className="select" onClick={onSignOut}>Sign out</button>
          <button className="btn btn--lime" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Start training →'}</button>
        </div>
      </form>
    </div>
  );
}
