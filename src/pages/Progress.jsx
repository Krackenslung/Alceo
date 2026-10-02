import { useState } from 'react';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { fmtVolume, kgToDisplay } from '../lib/units.js';
import {
  durationMinutes, exerciseTimeline, personalRecords, setLabel, toDate, weeklyVolume, workoutVolume,
} from '../lib/workouts.js';
import { addDays, formatCompact } from '../utils/dates.js';
import { downloadFile, toCsv } from '../store.js';

const RANGES = [
  { id: '4w', label: '4 weeks', days: 28, bucket: 'week', count: 4 },
  { id: '12w', label: '12 weeks', days: 84, bucket: 'week', count: 12 },
  { id: '6m', label: '6 months', days: 182, bucket: 'month', count: 6 },
  { id: '1y', label: '1 year', days: 365, bucket: 'month', count: 12 },
];

const between = (history, start, end) => history.filter((w) => {
  const d = toDate(w.finished_at);
  return d >= start && d < end;
});
const sum = (vals) => vals.reduce((a, b) => a + b, 0);
const avg = (vals) => (vals.length ? sum(vals) / vals.length : null);
const pctChange = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);
const signed = (n, suffix = '') => (n == null ? '—' : `${n >= 0 ? '+' : '−'}${Math.abs(n)}${suffix}`);

function monthlyVolume(history, today, count) {
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(today.getFullYear(), today.getMonth() - (count - 1 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: start.toLocaleDateString('en-US', { month: 'short' }),
      value: sum(between(history, start, end).map(workoutVolume)),
    };
  });
}

export default function Progress() {
  const { history, today, weekStart, units, catalogById } = useApp();
  const [rangeId, setRangeId] = useState('12w');
  const [allRecords, setAllRecords] = useState(false);
  const [exercise, setExercise] = useState('All');
  const range = RANGES.find((r) => r.id === rangeId);

  const end = addDays(today, 1);
  end.setHours(0, 0, 0, 0);
  const start = addDays(end, -range.days);
  const prevStart = addDays(start, -range.days);
  const current = between(history, start, end);
  const previous = between(history, prevStart, start);

  const volNow = sum(current.map(workoutVolume));
  const volPrev = sum(previous.map(workoutVolume));
  const minsNow = avg(current.map(durationMinutes).filter(Boolean));
  const minsPrev = avg(previous.map(durationMinutes).filter(Boolean));
  const { events, current: bests } = personalRecords(history);
  const prsNow = events.filter((e) => e.date >= start && e.date < end).length;
  const prsPrev = events.filter((e) => e.date >= prevStart && e.date < start).length;

  const stats = [
    ['Sessions', String(current.length), `${signed(current.length - previous.length)} vs prev. ${range.label}`],
    ['Total volume', fmtVolume(volNow, units), volPrev ? `${signed(pctChange(volNow, volPrev), '%')} vs prev.` : 'No earlier data'],
    ['Avg. session', minsNow ? `${Math.round(minsNow)} min` : '—', minsNow && minsPrev ? `${signed(Math.round(minsNow - minsPrev), ' min')} vs prev.` : '—'],
    ['New personal records', String(prsNow), `${prsPrev} in prev. ${range.label}`],
  ];

  const volume = range.bucket === 'week'
    ? weeklyVolume(history, today, weekStart, range.count)
    : monthlyVolume(history, today, range.count);
  const max = Math.max(1, ...volume.map((b) => b.value));

  const records = [...bests].sort((a, b) => b.date - a.date);

  // Best set at the start of the period vs the best set within it, per exercise.
  const inRange = exerciseTimeline(current);
  const strength = [];
  for (const t of inRange) {
    const row = strength.find((r) => r.id === t.exerciseId);
    if (!row) strength.push({ id: t.exerciseId, name: t.name, first: t.best, best: t.best });
    else if (t.best.weight_kg > row.best.weight_kg || (t.best.weight_kg === row.best.weight_kg && (t.best.reps ?? 0) > (row.best.reps ?? 0))) row.best = t.best;
  }
  const strengthRows = exercise === 'All' ? strength : strength.filter((r) => r.name === exercise);

  const muscleSets = {};
  for (const w of current) {
    for (const e of w.exercises) {
      const n = e.sets.filter((s) => s.completed_at && !s.is_warmup).length;
      if (!n) continue;
      const muscle = catalogById[e.exercise_id]?.primary_muscle ?? 'other';
      muscleSets[muscle] = (muscleSets[muscle] ?? 0) + n;
    }
  }
  const totalSets = sum(Object.values(muscleSets));
  const muscles = Object.entries(muscleSets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, n]) => [name, Math.round((n / totalSets) * 100)]);

  const exportReport = () => {
    const rows = [
      ['Section', 'Item', 'Value', 'Detail'],
      ...stats.map(([l, v, d]) => ['Summary', l, v, d]),
      ...volume.map((b) => ['Volume', b.label, Math.round(kgToDisplay(b.value, units)), units]),
      ...strength.map((r) => ['Strength', r.name, `${setLabel(r.first, units)} -> ${setLabel(r.best, units)}`, '']),
      ...muscles.map(([n, p]) => ['Muscle balance', n, `${p}%`, '']),
    ];
    downloadFile(`alceo-progress-${rangeId}.csv`, toCsv(rows));
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Your training over time · from completed sets</p>
          <h1 className="topbar__title">Progress</h1>
        </div>
        <TopActions />
      </header>

      <div className="toolbar">
        <div className="toolbar__left">
          {RANGES.map((r) => (
            <button key={r.id} className={`select${r.id === rangeId ? ' select--active' : ''}`} onClick={() => setRangeId(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        <button className="select" onClick={exportReport}>Export report</button>
      </div>

      <div className="kpis">
        {stats.map(([label, value, delta]) => (
          <div key={label} className="panel kpi">
            <p className="muted">{label}</p>
            <p className="kpi__value">{value}</p>
            <p className={`kpi__delta ${delta.startsWith('−') ? 'neg' : 'accent'}`}>{delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid--progress">
        <section className="panel">
          <div className="panel__head">
            <div>
              <h3 className="panel__title">{range.bucket === 'week' ? 'Weekly' : 'Monthly'} volume</h3>
              <p className="panel__sub">Weight × reps of completed working sets</p>
            </div>
            <span className="muted">{units}</span>
          </div>
          <div className="bars bars--tall">
            {volume.map((b, i) => (
              <div key={`${b.label}-${i}`} className="bars__col">
                <div
                  className={`bar${i === volume.length - 1 ? ' bar--accent' : ''}`}
                  style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }}
                  title={fmtVolume(b.value, units)}
                />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Personal records</h3>
            {records.length > 5 && (
              <button className="link" onClick={() => setAllRecords((a) => !a)}>{allRecords ? 'Show less' : 'See all'}</button>
            )}
          </div>
          {records.length === 0 ? (
            <p className="panel__sub">Complete weighted sets to start tracking records.</p>
          ) : (
            <ul className="records">
              {(allRecords ? records : records.slice(0, 5)).map((r) => (
                <li key={r.exerciseId}>
                  <span className="records__star">★</span>
                  <div>
                    <strong>{r.name}</strong>
                    <p className="muted">{formatCompact(r.date)}</p>
                  </div>
                  <span>{setLabel(r.best, units)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <div>
              <h3 className="panel__title">Strength by exercise</h3>
              <p className="panel__sub">Best set, first session in range → best in range</p>
            </div>
            <select className="select" aria-label="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)}>
              <option>All</option>
              {strength.map((r) => <option key={r.id}>{r.name}</option>)}
            </select>
          </div>
          {strengthRows.length === 0 ? (
            <p className="panel__sub">No weighted sets in this range.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Exercise</th><th>Start</th><th>Best</th><th>Change</th></tr>
              </thead>
              <tbody>
                {strengthRows.map((r) => {
                  const change = pctChange(r.best.weight_kg, r.first.weight_kg);
                  return (
                    <tr key={r.id}>
                      <td className="strong">{r.name}</td>
                      <td className="muted">{setLabel(r.first, units)}</td>
                      <td>{setLabel(r.best, units)}</td>
                      <td className={change > 0 ? 'accent' : 'muted'}>{change ? signed(change, '%') : '='}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h3 className="panel__title">Muscle group balance</h3>
          <p className="panel__sub">Share of completed sets, last {range.label}</p>
          {muscles.length === 0 ? (
            <p className="panel__sub">No completed sets in this range.</p>
          ) : (
            <ul className="muscles">
              {muscles.map(([name, pct]) => (
                <li key={name}>
                  <div className="muscles__row"><span className="cap">{name}</span><span className="muted">{pct}%</span></div>
                  <div className="muscles__track"><div className="muscles__fill" style={{ width: `${pct}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
