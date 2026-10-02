import { useEffect, useState } from 'react';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import TopActions from '../components/TopActions.jsx';
import { formatLong } from '../utils/dates.js';

const parseSets = (sets) => {
  const m = /^(\d+)\s*×/.exec(sets);
  return m ? Number(m[1]) : 1;
};
const parseReps = (sets) => {
  const m = /×\s*(\d+)/.exec(sets);
  return m ? Number(m[1]) : 0;
};
const parseKg = (weight) => (/kg/.test(weight) ? parseFloat(weight) || 0 : 0);

const fmtClock = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function Session({ workout, date, onFinish, onCancel }) {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState({});

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const groups = [['Warm-up', workout.warmup, 'w'], ['Main workout', workout.main, 'm']];
  const all = groups.flatMap(([, rows, p]) => rows.map((e) => ({ ...e, key: p + e.name })));
  const totalSets = all.reduce((n, e) => n + parseSets(e.sets), 0);
  const doneSets = all.reduce((n, e) => n + (done[e.key] ?? 0), 0);

  const setCount = (key, i) => setDone((d) => ({ ...d, [key]: d[key] === i + 1 ? i : i + 1 }));

  const finish = () => {
    const minutes = Math.max(1, Math.round((now - start) / 60000));
    const volume = all.reduce((v, e) => v + (done[e.key] ?? 0) * parseReps(e.sets) * parseKg(e.weight), 0);
    onFinish({ minutes, volume, doneSets, totalSets });
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(date)}</p>
          <h1 className="topbar__title">{workout.name}</h1>
        </div>
        <TopActions />
      </header>

      <section className="panel session">
        <div className="session__bar">
          <div className="session__stats">
            <div><strong>{fmtClock(now - start)}</strong><span className="muted">Elapsed</span></div>
            <div><strong>{doneSets}/{totalSets}</strong><span className="muted">Sets done</span></div>
            <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
          </div>
          <div className="session__actions">
            <button className="select" onClick={onCancel}>Cancel</button>
            <button className="btn btn--lime" onClick={finish}>Finish workout</button>
          </div>
        </div>
        <div className="progressbar"><div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>

        {groups.map(([label, rows, p]) => (
          <div key={label}>
            <h4 className="flabel">{label.toUpperCase()}</h4>
            <ul className="session__list">
              {rows.map((e) => {
                const key = p + e.name;
                const n = parseSets(e.sets);
                return (
                  <li key={key}>
                    <div>
                      <strong>{e.name}</strong>
                      <p className="muted">{e.equipment} · {e.sets}{e.weight !== '—' ? ` · ${e.weight}` : ''}</p>
                    </div>
                    <div className="setboxes">
                      {Array.from({ length: n }, (_, i) => (
                        <button
                          key={i}
                          className={`setbox${(done[key] ?? 0) > i ? ' setbox--on' : ''}`}
                          aria-pressed={(done[key] ?? 0) > i}
                          aria-label={`${e.name} set ${i + 1}`}
                          onClick={() => setCount(key, i)}
                        >
                          {(done[key] ?? 0) > i ? '✓' : i + 1}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
