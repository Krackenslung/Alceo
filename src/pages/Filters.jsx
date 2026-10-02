import { useEffect, useState } from 'react';
import Chip from '../components/Chip.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import {
  DAYS, EQUIPMENT, EQUIPMENT_LABEL, EXTRA_TYPES, FOCUSES, INTENSITY_LABELS, LENGTHS, MUSCLES, SPORTS, TYPE_LABEL,
} from '../data/filters.js';
import { displayToKg, kgToDisplay } from '../lib/units.js';

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

function TextAdder({ placeholder, onAdd, label }) {
  const [draft, setDraft] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    const text = (draft ?? '').trim();
    if (text) onAdd(text.slice(0, 255));
    setDraft(null);
  };
  if (draft === null) return <button className="link" onClick={() => setDraft('')}>{label}</button>;
  return (
    <form onSubmit={submit}>
      <input className="avoid__input" autoFocus maxLength={255} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={submit} />
    </form>
  );
}

function ExtraAdder({ onAdd }) {
  const [draft, setDraft] = useState(null);
  if (draft === null) return <button className="link link--pad" onClick={() => setDraft({ filter_type: 'venue', description: '' })}>+ Add note</button>;
  const submit = (e) => {
    e.preventDefault();
    if (draft.description.trim()) onAdd({ ...draft, description: draft.description.trim(), value_num: null, unit: null });
    setDraft(null);
  };
  return (
    <form className="picker picker--tight" onSubmit={submit}>
      <select value={draft.filter_type} onChange={(e) => setDraft({ ...draft, filter_type: e.target.value })}>
        {EXTRA_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <input autoFocus maxLength={255} placeholder="e.g. home gym, 5 km in 24:10" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      <button className="btn btn--lime" type="submit">Add</button>
      <button className="select" type="button" onClick={() => setDraft(null)}>Cancel</button>
    </form>
  );
}

export default function Filters() {
  const { filters: saved, saveFilters, generate, generating, units, toast } = useApp();
  const [draft, setDraft] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [targetText, setTargetText] = useState('');
  useEffect(() => {
    setDraft(saved);
    setTargetText(saved.weightTarget == null ? '' : String(kgToDisplay(saved.weightTarget, units)));
  }, [saved, units]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (patch) => setDraft((f) => ({ ...f, ...patch }));

  const save = async ({ thenGenerate = false } = {}) => {
    setBusy(true);
    try {
      if (dirty) await saveFilters(draft);
      if (thenGenerate) generate({ navigate: true });
      else toast('Filters saved');
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };

  const intensity = draft.intensity ?? 7;
  const allEquipment = draft.equipment.length === EQUIPMENT.length;

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">The AI reads these every time it builds a workout</p>
          <h1 className="topbar__title">Filters</h1>
        </div>
        <TopActions />
      </header>

      <div className="toolbar">
        <p className="muted">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <div className="toolbar__left">
          <button
            className="select"
            disabled={!dirty || busy}
            onClick={() => {
              setDraft(saved);
              setTargetText(saved.weightTarget == null ? '' : String(kgToDisplay(saved.weightTarget, units)));
            }}
          >
            Discard
          </button>
          <button className="btn btn--ghost" disabled={!dirty || busy} onClick={() => save()}>Save</button>
          <button className="btn btn--lime" disabled={busy || generating} onClick={() => save({ thenGenerate: true })}>
            {generating ? 'Generating…' : dirty ? '✦ Save & generate workout' : '✦ Generate workout'}
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filters__col">
          <section className="panel">
            <h3 className="panel__title">Sport focus</h3>
            <p className="panel__sub">What you’re training for</p>
            <p className="flabel">SPORT · pick one</p>
            <div className="chips">
              {SPORTS.map((s) => (
                <Chip key={s} active={draft.sport === s} onClick={() => set({ sport: s })}>{s}</Chip>
              ))}
            </div>
            <p className="flabel">TRAINING FOCUS · pick one</p>
            <div className="chips">
              {FOCUSES.map((s) => (
                <Chip key={s} active={draft.focus === s} onClick={() => set({ focus: draft.focus === s ? null : s })}>{s}</Chip>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Schedule &amp; effort</h3>
            <p className="flabel">TRAINING DAYS</p>
            <div className="days">
              {DAYS.map((d) => (
                <Chip key={d} active={draft.days.includes(d)} onClick={() => set({ days: DAYS.filter((x) => toggle(draft.days, d).includes(x)) })}>{d}</Chip>
              ))}
            </div>
            <p className="flabel">SESSION LENGTH</p>
            <div className="chips">
              {LENGTHS.map((l) => (
                <Chip key={l} active={draft.length === l} onClick={() => set({ length: draft.length === l ? null : l })}>{l} min</Chip>
              ))}
            </div>
            <div className="flabel flabel--row">
              <span>INTENSITY (RPE)</span>
              {draft.intensity == null ? (
                <span className="muted">Not set · move the slider</span>
              ) : (
                <span className="accent">
                  {draft.intensity} / 10 · {INTENSITY_LABELS[Math.round(draft.intensity)]}{' '}
                  <button className="link" onClick={() => set({ intensity: null })}>clear</button>
                </span>
              )}
            </div>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={intensity}
              aria-label="Intensity"
              style={{ '--pct': draft.intensity == null ? '0%' : `${((intensity - 1) / 9) * 100}%` }}
              onChange={(e) => set({ intensity: Number(e.target.value) })}
            />
            <div className="slider__ends"><span>Easy</span><span>Max</span></div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Muscle priorities</h3>
            <p className="panel__sub">Muscles to give more volume</p>
            <div className="chips chips--top">
              {MUSCLES.map((m) => (
                <Chip key={m} active={draft.muscles.includes(m)} onClick={() => set({ muscles: toggle(draft.muscles, m) })}>{m}</Chip>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Weight goal</h3>
            <p className="panel__sub">Target body weight</p>
            <div className="pgrid">
              <label className="pfield">
                <span className="pfield__label">Target</span>
                <div className="unit">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={targetText}
                    onChange={(e) => {
                      setTargetText(e.target.value);
                      set({ weightTarget: displayToKg(e.target.value, units) });
                    }}
                  />
                  <span>{units}</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        <div className="filters__col">
          <section className="panel">
            <div className="panel__head">
              <div>
                <h3 className="panel__title">Available equipment</h3>
                <p className="panel__sub">
                  {draft.equipment.length ? 'The AI only uses exercises for this equipment' : 'None selected: the AI may use any equipment'}
                </p>
              </div>
              <button className="link" onClick={() => set({ equipment: allEquipment ? [] : EQUIPMENT.map(([id]) => id) })}>
                {allEquipment ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="machines">
              {EQUIPMENT.map(([id, label]) => {
                const on = draft.equipment.includes(id);
                return (
                  <button key={id} className={`machine${on ? ' machine--on' : ''}`} aria-pressed={on} onClick={() => set({ equipment: toggle(draft.equipment, id) })}>
                    <span className="machine__box">{on && '✓'}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Injuries</h3>
            <p className="panel__sub">The AI avoids loading these areas</p>
            <div className="chips chips--top">
              {draft.injuries.map((a) => (
                <span key={a} className="avoid">
                  {a}
                  <button aria-label={`Remove ${a}`} onClick={() => set({ injuries: draft.injuries.filter((x) => x !== a) })}>×</button>
                </span>
              ))}
              <TextAdder
                label="+ Add injury"
                placeholder="e.g. left knee, avoid deep squats"
                onAdd={(text) => !draft.injuries.some((x) => x.toLowerCase() === text.toLowerCase()) && set({ injuries: [...draft.injuries, text] })}
              />
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Other notes</h3>
            <p className="panel__sub">Venue, benchmarks and anything else the AI should know</p>
            {draft.extras.length > 0 && (
              <ul className="prefs prefs--top">
                {draft.extras.map((x, i) => (
                  <li key={`${x.filter_type}-${x.description}`}>
                    <div>
                      <strong>{TYPE_LABEL[x.filter_type] ?? x.filter_type}</strong>
                      <p className="muted">{x.description}{x.value_num != null ? ` · ${x.value_num}${x.unit ? ` ${x.unit}` : ''}` : ''}</p>
                    </div>
                    <button className="row-x" aria-label={`Remove ${x.description}`} onClick={() => set({ extras: draft.extras.filter((_, j) => j !== i) })}>×</button>
                  </li>
                ))}
              </ul>
            )}
            <ExtraAdder
              onAdd={(row) => !draft.extras.some((x) => x.filter_type === row.filter_type && x.description.toLowerCase() === row.description.toLowerCase())
                && set({ extras: [...draft.extras, row] })}
            />
          </section>

          <section className="preview">
            <p className="preview__eyebrow">THE AI WILL USE</p>
            <h3 className="preview__title">
              {draft.days.length ? `${draft.days.length} days a week` : 'Any day'}{draft.length ? ` · ~${draft.length} min` : ''}
            </h3>
            <div className="preview__tags">
              {draft.sport !== 'None' && <span className="tag">{draft.sport}</span>}
              {draft.focus && <span className="tag">{draft.focus}</span>}
              {draft.intensity != null && <span className="tag">RPE {draft.intensity}/10</span>}
              {draft.muscles.length > 0 && <span className="tag">{draft.muscles.join(' · ')}</span>}
              <span className="tag">
                {draft.equipment.length ? draft.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ') : 'Any equipment'}
              </span>
              {draft.injuries.length > 0 && <span className="tag">{draft.injuries.length} injur{draft.injuries.length === 1 ? 'y' : 'ies'}</span>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
