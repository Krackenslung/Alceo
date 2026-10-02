import { useState } from 'react';
import Segmented from '../components/Segmented.jsx';
import Switch from '../components/Switch.jsx';

const KG_TO_LB = 2.20462;
const CM_TO_IN = 1 / 2.54;
const round1 = (n) => String(Math.round(n * 10) / 10);

// Converts the numeric strings of the body metrics when the unit system changes.
const convertMetrics = (m, from, to) => {
  if (from === to) return m;
  const conv = (v, k) => (v === '' || isNaN(Number(v)) ? v : round1(Number(v) * k));
  const weight = to === 'lb' ? KG_TO_LB : 1 / KG_TO_LB;
  const height = to === 'lb' ? CM_TO_IN : 2.54;
  return { ...m, height: conv(m.height, height), weight: conv(m.weight, weight), target: conv(m.target, weight) };
};

function Field({ label, children }) {
  return (
    <label className="pfield">
      <span className="pfield__label">{label}</span>
      {children}
    </label>
  );
}

export default function Profile({ profile, setProfile, filters }) {
  const { info, prefs } = profile;
  const [draft, setDraft] = useState(info);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(info);
  const edit = (patch) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };
  const setPref = (patch) => setProfile((p) => ({ ...p, prefs: { ...p.prefs, ...patch } }));

  const changeUnits = (units) => {
    if (units === prefs.units) return;
    const next = convertMetrics(draft, prefs.units, units);
    const nextInfo = convertMetrics(info, prefs.units, units);
    setDraft(next);
    setProfile((p) => ({ ...p, info: nextInfo, prefs: { ...p.prefs, units } }));
  };

  const save = () => {
    setProfile((p) => ({ ...p, info: draft }));
    setSaved(true);
  };

  const kg = prefs.units === 'kg';
  const initials = `${info.first[0] ?? ''}${info.last[0] ?? ''}`.toUpperCase();
  const sport = [filters.primary !== 'None' && filters.primary, filters.secondary].filter(Boolean).join(' + ');

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Your account and body data</p>
          <h1 className="topbar__title">Profile</h1>
        </div>
        <div className="topbar__actions">
          <button className="icon-btn" aria-label="Settings">⚙</button>
          <span className="avatar">{initials}</span>
        </div>
      </header>

      <section className="panel hero-profile">
        <span className="avatar avatar--lg">{initials}</span>
        <div className="hero-profile__info">
          <h2>{info.first} {info.last}</h2>
          <p className="muted">{info.email} · Member since Sep 2026</p>
          <div className="chips chips--top">
            <span className="tag tag--lime">{info.level}</span>
            {sport && <span className="tag tag--lime">{sport}</span>}
          </div>
        </div>
        <div className="hero-profile__stats">
          {[['38', 'Sessions'], ['9', 'PRs'], ['4', 'Day streak']].map(([v, l]) => (
            <div key={l}><strong>{v}</strong><span className="muted">{l}</span></div>
          ))}
        </div>
        <button className="select">Change photo</button>
      </section>

      <div className="filters">
        <div className="filters__col">
          <section className="panel">
            <h3 className="panel__title">Personal info</h3>
            <div className="pgrid">
              <Field label="First name">
                <input value={draft.first} onChange={(e) => edit({ first: e.target.value })} />
              </Field>
              <Field label="Last name">
                <input value={draft.last} onChange={(e) => edit({ last: e.target.value })} />
              </Field>
              <div className="pgrid__full">
                <Field label="Email">
                  <input type="email" value={draft.email} onChange={(e) => edit({ email: e.target.value })} />
                </Field>
              </div>
              <Field label="Date of birth">
                <input type="date" value={draft.dob} onChange={(e) => edit({ dob: e.target.value })} />
              </Field>
              <Field label="Sex">
                <select value={draft.sex} onChange={(e) => edit({ sex: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <h3 className="panel__title">Body metrics</h3>
                <p className="panel__sub">Used to size weights and track progress</p>
              </div>
              <button className="link">History</button>
            </div>
            <div className="pgrid">
              <Field label="Height">
                <div className="unit">
                  <input inputMode="decimal" value={draft.height} onChange={(e) => edit({ height: e.target.value })} />
                  <span>{kg ? 'cm' : 'in'}</span>
                </div>
              </Field>
              <Field label="Weight">
                <div className="unit">
                  <input inputMode="decimal" value={draft.weight} onChange={(e) => edit({ weight: e.target.value })} />
                  <span>{prefs.units}</span>
                </div>
              </Field>
              <Field label="Experience level">
                <select value={draft.level} onChange={(e) => edit({ level: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </Field>
              <Field label="Target weight">
                <div className="unit">
                  <input inputMode="decimal" value={draft.target} onChange={(e) => edit({ target: e.target.value })} />
                  <span>{prefs.units}</span>
                </div>
              </Field>
            </div>
            <div className="save">
              <button className="btn btn--lime" disabled={!dirty} onClick={save}>
                {saved && !dirty ? '✓ Saved' : 'Save changes'}
              </button>
            </div>
          </section>
        </div>

        <div className="filters__col">
          <section className="panel">
            <h3 className="panel__title">Preferences</h3>
            <ul className="prefs">
              <li>
                <div><strong>Units</strong><p className="muted">Weights and body measurements</p></div>
                <Segmented label="Units" options={[['kg', 'kg'], ['lb', 'lb']]} value={prefs.units} onChange={changeUnits} />
              </li>
              <li>
                <div><strong>Language</strong></div>
                <Segmented label="Language" options={[['en', 'English'], ['es', 'Español']]} value={prefs.language} onChange={(language) => setPref({ language })} />
              </li>
              <li>
                <div><strong>Week starts on</strong></div>
                <Segmented label="Week starts on" options={[['mon', 'Mon'], ['sun', 'Sun']]} value={prefs.weekStart} onChange={(weekStart) => setPref({ weekStart })} />
              </li>
              <li>
                <div><strong>Workout reminders</strong><p className="muted">Notify me on training days</p></div>
                <Switch label="Workout reminders" on={prefs.reminders} onChange={(reminders) => setPref({ reminders })} />
              </li>
              <li>
                <div><strong>Weekly AI plan</strong><p className="muted">Auto-generate next week every Sunday</p></div>
                <Switch label="Weekly AI plan" on={prefs.weeklyPlan} onChange={(weeklyPlan) => setPref({ weeklyPlan })} />
              </li>
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel__title">Account</h3>
            <ul className="prefs">
              <li>
                <div><strong>Password</strong><p className="muted">Last changed 2 weeks ago</p></div>
                <button className="link">Change</button>
              </li>
              <li>
                <div><strong>Export my data</strong><p className="muted">Download all workouts as CSV</p></div>
                <button className="link">Export</button>
              </li>
              <li>
                <div><strong>Sign out</strong></div>
                <button className="select">Sign out</button>
              </li>
              <li>
                <div>
                  <strong>Delete account</strong>
                  <p className="muted">
                    {confirmDelete ? 'This cannot be undone. Are you sure?' : 'Permanently remove your data'}
                  </p>
                </div>
                {confirmDelete ? (
                  <div className="confirm">
                    <button className="select" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    <button className="btn-danger">Confirm</button>
                  </div>
                ) : (
                  <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
                )}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
