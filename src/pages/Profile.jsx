import { useRef, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Segmented from '../components/Segmented.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { patch } from '../api/client.js';
import { cmToDisplay, displayToCm, displayToKg, heightUnit, kgToDisplay, round } from '../lib/units.js';
import { personalRecords, toDate, trainingStreak, workoutName } from '../lib/workouts.js';
import { downloadFile, toCsv } from '../store.js';

const str = (v) => (v == null ? '' : String(v));
const SEX_LABEL = { male: 'Male', female: 'Female', other: 'Other' };

const toForm = (user, units) => ({
  name: user.name,
  date_of_birth: user.date_of_birth ?? '',
  sex: user.sex ?? '',
  height: str(cmToDisplay(user.height_cm, units)),
  weight: str(kgToDisplay(user.weight_kg, units)),
  body_fat_pct: str(user.body_fat_pct),
});

function Field({ label, children, full }) {
  return (
    <label className={`pfield${full ? ' pgrid__full' : ''}`}>
      <span className="pfield__label">{label}</span>
      {children}
    </label>
  );
}

export default function Profile() {
  const { user, setUser, prefs, setPrefs, units, history, filters, today, setPhoto, signOut, deleteAccount, toast } = useApp();
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(() => toForm(user, units));
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const original = toForm(user, units);
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const edit = (p) => setDraft((d) => ({ ...d, ...p }));

  const changeUnits = (next) => {
    if (next === units) return;
    setPrefs((p) => ({ ...p, units: next }));
    setDraft(toForm(user, next));
  };

  const save = async () => {
    const body = {};
    if (draft.name.trim() !== original.name) body.name = draft.name.trim();
    if (draft.date_of_birth !== original.date_of_birth) body.date_of_birth = draft.date_of_birth || null;
    if (draft.sex !== original.sex) body.sex = draft.sex || null;
    if (draft.height !== original.height) body.height_cm = displayToCm(draft.height, units);
    if (draft.weight !== original.weight) body.weight_kg = displayToKg(draft.weight, units);
    if (draft.body_fat_pct !== original.body_fat_pct) body.body_fat_pct = draft.body_fat_pct === '' ? null : round(Number(draft.body_fat_pct), 1);
    setBusy(true);
    try {
      const updated = await patch('/users/me', body);
      setUser(updated);
      setDraft(toForm(updated, units));
      toast('Profile saved');
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const rows = [['Date', 'Workout', 'Exercise', 'Set', 'Warm-up', 'Reps', 'Weight (kg)', 'Duration (s)', 'Distance (m)', 'RPE', 'Completed']];
    for (const w of history) {
      for (const e of w.exercises) {
        for (const s of e.sets) {
          rows.push([
            w.finished_at, workoutName(w), e.exercise_name, s.set_number, s.is_warmup ? 'yes' : 'no',
            s.reps ?? '', s.weight_kg ?? '', s.duration_seconds ?? '', s.distance_m ?? '', s.rpe ?? '', s.completed_at ? 'yes' : 'no',
          ]);
        }
      }
    }
    downloadFile('alceo-workouts.csv', toCsv(rows));
  };

  const prs = personalRecords(history).events.length;
  const streak = trainingStreak(history, today);
  const since = toDate(user.created_at)?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const tags = [filters.sport !== 'None' && filters.sport, filters.focus].filter(Boolean);

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
          <h2>{user.name}</h2>
          <p className="muted">{user.email} · Member since {since}</p>
          <div className="chips chips--top">
            <span className="tag tag--lime">{user.role === 'trainer' ? 'Trainer' : 'Athlete'}</span>
            {tags.map((t) => <span key={t} className="tag tag--lime">{t}</span>)}
          </div>
        </div>
        <div className="hero-profile__stats">
          {[[history.length, 'Sessions'], [prs, 'PRs'], [streak, 'Day streak']].map(([v, l]) => (
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
              <Field label="Name" full>
                <input maxLength={100} value={draft.name} onChange={(e) => edit({ name: e.target.value })} />
              </Field>
              <Field label="Email" full>
                <input type="email" value={user.email} readOnly disabled title="Email can’t be changed" />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={draft.date_of_birth} onChange={(e) => edit({ date_of_birth: e.target.value })} />
              </Field>
              <Field label="Sex">
                <select value={draft.sex} onChange={(e) => edit({ sex: e.target.value })}>
                  {Object.entries(SEX_LABEL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Body metrics</h3>
            <p className="panel__sub">Used by the AI to size your weights</p>
            <div className="pgrid">
              <Field label="Height">
                <div className="unit">
                  <input type="number" inputMode="decimal" step="0.1" min="1" value={draft.height} onChange={(e) => edit({ height: e.target.value })} />
                  <span>{heightUnit(units)}</span>
                </div>
              </Field>
              <Field label="Weight">
                <div className="unit">
                  <input type="number" inputMode="decimal" step="0.1" min="1" value={draft.weight} onChange={(e) => edit({ weight: e.target.value })} />
                  <span>{units}</span>
                </div>
              </Field>
              <Field label="Body fat">
                <div className="unit">
                  <input type="number" inputMode="decimal" step="0.1" min="0" max="100" value={draft.body_fat_pct} onChange={(e) => edit({ body_fat_pct: e.target.value })} />
                  <span>%</span>
                </div>
              </Field>
            </div>
            <div className="save">
              <button className="select" disabled={!dirty || busy} onClick={() => setDraft(original)}>Discard</button>
              <button className="btn btn--lime" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
          </section>
        </div>

        <div className="filters__col">
          <section className="panel">
            <h3 className="panel__title">Preferences</h3>
            <p className="panel__sub">Stored on this device</p>
            <ul className="prefs prefs--top">
              <li>
                <div><strong>Units</strong><p className="muted">Data is stored in kg/cm and converted for display</p></div>
                <Segmented label="Units" options={[['kg', 'kg'], ['lb', 'lb']]} value={units} onChange={changeUnits} />
              </li>
              <li>
                <div><strong>Week starts on</strong></div>
                <Segmented label="Week starts on" options={[['mon', 'Mon'], ['sun', 'Sun']]} value={prefs.weekStart} onChange={(weekStart) => setPrefs((p) => ({ ...p, weekStart }))} />
              </li>
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel__title">Account</h3>
            <ul className="prefs">
              <li>
                <div><strong>Export my data</strong><p className="muted">Every set of your completed workouts as CSV</p></div>
                <button className="link" onClick={exportCsv} disabled={!history.length}>Export</button>
              </li>
              <li>
                <div><strong>Sign out</strong></div>
                <button className="select" onClick={signOut}>Sign out</button>
              </li>
              <li>
                <div>
                  <strong>Delete account</strong>
                  <p className="muted">{confirmDelete ? 'You will be signed out and can’t log in again. Are you sure?' : 'Close your account'}</p>
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
