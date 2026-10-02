import { useState } from 'react';
import Chip from '../components/Chip.jsx';
import {
  DAYS, DEFAULT_FILTERS, INTENSITY_LABELS, LENGTHS, MACHINES, MUSCLES, PRIMARY, SECONDARY,
} from '../data/filters.js';

const toggle = (list, item) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function Filters({ filters, setFilters }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [applied, setApplied] = useState(false);
  const set = (patch) => {
    setApplied(false);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const addAvoid = (e) => {
    e.preventDefault();
    const name = draft.trim();
    if (name && !filters.avoid.includes(name)) set({ avoid: [...filters.avoid, name] });
    setDraft('');
    setAdding(false);
  };

  const allSelected = filters.machines.length === MACHINES.length;
  const sports = [filters.primary !== 'None' && filters.primary, filters.secondary].filter(Boolean).join(' + ');

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">The AI builds your weekly plan from these settings</p>
          <h1 className="topbar__title">Filters</h1>
        </div>
        <div className="topbar__actions">
          <button className="icon-btn" aria-label="Settings">⚙</button>
          <span className="avatar">JM</span>
        </div>
      </header>

      <div className="toolbar">
        <button className="select">Applies to: <strong>Next week · Oct 5 – 11</strong> ▾</button>
        <div className="toolbar__left">
          <button className="select" onClick={() => { setFilters(DEFAULT_FILTERS); setApplied(false); }}>Reset</button>
          <button className="btn btn--lime" onClick={() => setApplied(true)}>
            {applied ? '✓ Plan generated' : '✦ Apply & generate plan'}
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filters__col">
          <section className="panel">
            <h3 className="panel__title">Sport focus</h3>
            <p className="panel__sub">What you’re training for this week</p>
            <p className="flabel">PRIMARY · pick one</p>
            <div className="chips">
              {PRIMARY.map((s) => (
                <Chip key={s} active={filters.primary === s} onClick={() => set({ primary: s })}>{s}</Chip>
              ))}
            </div>
            <p className="flabel">SECONDARY · pick one</p>
            <div className="chips">
              {SECONDARY.map((s) => (
                <Chip key={s} active={filters.secondary === s} onClick={() => set({ secondary: s })}>{s}</Chip>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Schedule &amp; effort</h3>
            <p className="flabel">TRAINING DAYS</p>
            <div className="days">
              {DAYS.map((d) => (
                <Chip key={d} active={filters.days.includes(d)} onClick={() => set({ days: toggle(filters.days, d) })}>{d}</Chip>
              ))}
            </div>
            <p className="flabel">SESSION LENGTH</p>
            <div className="chips">
              {LENGTHS.map((l) => (
                <Chip key={l} active={filters.length === l} onClick={() => set({ length: l })}>{l} min</Chip>
              ))}
            </div>
            <div className="flabel flabel--row">
              <span>INTENSITY</span>
              <span className="accent">{filters.intensity} / 10 · {INTENSITY_LABELS[filters.intensity]}</span>
            </div>
            <input
              className="slider"
              type="range"
              min="1"
              max="10"
              value={filters.intensity}
              aria-label="Intensity"
              style={{ '--pct': `${((filters.intensity - 1) / 9) * 100}%` }}
              onChange={(e) => set({ intensity: Number(e.target.value) })}
            />
            <div className="slider__ends"><span>Easy</span><span>Max</span></div>
          </section>

          <section className="panel">
            <h3 className="panel__title">Muscle priorities</h3>
            <p className="panel__sub">Get more volume this week</p>
            <div className="chips chips--top">
              {MUSCLES.map((m) => (
                <Chip key={m} active={filters.muscles.includes(m)} onClick={() => set({ muscles: toggle(filters.muscles, m) })}>{m}</Chip>
              ))}
            </div>
          </section>
        </div>

        <div className="filters__col">
          <section className="panel">
            <div className="panel__head">
              <div>
                <h3 className="panel__title">Available machines</h3>
                <p className="panel__sub">Only these will be used in your plan</p>
              </div>
              <button className="link" onClick={() => set({ machines: allSelected ? [] : [...MACHINES] })}>
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="machines">
              {MACHINES.map((m) => {
                const on = filters.machines.includes(m);
                return (
                  <button
                    key={m}
                    className={`machine${on ? ' machine--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => set({ machines: toggle(filters.machines, m) })}
                  >
                    <span className="machine__box">{on && '✓'}</span>
                    {m}
                  </button>
                );
              })}
            </div>
            <button className="link link--pad">+ Add machine</button>
          </section>

          <section className="panel">
            <h3 className="panel__title">Exercises to avoid</h3>
            <p className="panel__sub">The AI won’t include these</p>
            <div className="chips chips--top">
              {filters.avoid.map((a) => (
                <span key={a} className="avoid">
                  {a}
                  <button aria-label={`Remove ${a}`} onClick={() => set({ avoid: filters.avoid.filter((x) => x !== a) })}>×</button>
                </span>
              ))}
              {adding ? (
                <form onSubmit={addAvoid}>
                  <input
                    className="avoid__input"
                    autoFocus
                    value={draft}
                    placeholder="Exercise name"
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={addAvoid}
                  />
                </form>
              ) : (
                <button className="link" onClick={() => setAdding(true)}>+ Add exercise</button>
              )}
            </div>
          </section>

          <section className="preview">
            <p className="preview__eyebrow">NEXT WEEK PREVIEW</p>
            <h3 className="preview__title">
              {filters.days.length} sessions · ~{filters.length} min each
            </h3>
            <div className="preview__tags">
              {sports && <span className="tag">{sports}</span>}
              <span className="tag">Intensity {filters.intensity}/10</span>
              {filters.muscles.length > 0 && <span className="tag">{filters.muscles.join(' · ')}</span>}
              <span className="tag">{filters.machines.length} machines</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
