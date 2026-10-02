import { useRef, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Segmented from '../components/Segmented.jsx';
import Switch from '../components/Switch.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { downloadFile, toCsv } from '../store.js';

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

const WEIGHT_HISTORY = [['Sep 28', 76.5], ['Sep 14', 76.9], ['Aug 31', 77.4], ['Aug 17', 77.8]];

export default function Profile({ profile, setProfile, filters }) {
  const { info, prefs } = profile;
  const { history, setPhoto, signOut, deleteAccount, toast } = useApp();
  const fileRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pw, setPw] = useState(null); // null = closed, otherwise { next, confirm, error }
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
  const sport = [filters.primary !== 'None' && filters.primary, filters.secondary].filter(Boolean).join(' + ');

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Your account and body data</p>
          <h1 className="topbar__title">Profile</h1>
        </div>
        <TopActions />
      </header>

      <section className="panel hero-profile">
        <Avatar large />
        <div className="hero-profile__info">
          <h2>{info.first} {info.last}</h2>
          <p className="muted">{info.email} · Member since Sep 2026</p>
          <div className="chips chips--top">
            <span className="tag tag--lime">{info.level}</span>
            {sport && <span className="tag tag--lime">{sport}</span>}
          </div>
        </div>
        <div className="hero-profile__stats">
          {[[String(38 + Math.max(0, history.length - 3)), 'Sessions'], ['9', 'PRs'], ['4', 'Day streak']].map(([v, l]) => (
            <div key={l}><strong>{v}</strong><span className="muted">{l}</span></div>
          ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setPhoto(String(reader.result));
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />
        <button className="select" onClick={() => fileRef.current?.click()}>Change photo</button>
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
              <button className="link" onClick={() => setShowHistory((h) => !h)}>{showHistory ? 'Hide' : 'History'}</button>
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
            {showHistory && (
              <ul className="whist">
                {WEIGHT_HISTORY.map(([d, w]) => (
                  <li key={d}><span className="muted">{d}</span><span>{kg ? w : round1(w * KG_TO_LB)} {prefs.units}</span></li>
                ))}
              </ul>
            )}
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
                <button className="link" onClick={() => setPw(pw ? null : { next: '', confirm: '', error: '' })}>
                  {pw ? 'Cancel' : 'Change'}
                </button>
              </li>
              {pw && (
                <li className="prefs__form">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (pw.next.length < 8) return setPw({ ...pw, error: 'Use at least 8 characters.' });
                      if (pw.next !== pw.confirm) return setPw({ ...pw, error: 'Passwords do not match.' });
                      setPw(null);
                      toast('Password updated');
                    }}
                  >
                    <input type="password" placeholder="New password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value, error: '' })} />
                    <input type="password" placeholder="Confirm password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value, error: '' })} />
                    {pw.error && <p className="neg">{pw.error}</p>}
                    <button className="btn btn--lime" type="submit">Update password</button>
                  </form>
                </li>
              )}
              <li>
                <div><strong>Export my data</strong><p className="muted">Download all workouts as CSV</p></div>
                <button
                  className="link"
                  onClick={() => downloadFile('alceo-workouts.csv', toCsv([
                    ['Session', 'Date', 'Duration', 'Volume', 'Effort'],
                    ...history.map((h) => [h.name, h.date, h.duration, h.volume, h.effort]),
                  ]))}
                >
                  Export
                </button>
              </li>
              <li>
                <div><strong>Sign out</strong></div>
                <button className="select" onClick={signOut}>Sign out</button>
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
                    <button className="btn-danger" onClick={deleteAccount}>Confirm</button>
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
