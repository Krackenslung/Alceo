import { useState } from 'react';
import TopActions from '../components/TopActions.jsx';
import { PROGRESS, RANGES, RECORDS, STRENGTH } from '../data/progress.js';
import { downloadFile, toCsv } from '../store.js';

export default function Progress() {
  const [rangeId, setRangeId] = useState('12w');
  const [allRecords, setAllRecords] = useState(false);
  const [exercise, setExercise] = useState('All');
  const range = RANGES.find((r) => r.id === rangeId);
  const data = PROGRESS[rangeId];
  const max = Math.max(...data.volume.map((b) => b.value));
  const strengthRows = exercise === 'All' ? STRENGTH : STRENGTH.filter((r) => r[0] === exercise);

  const exportReport = () => {
    const rows = [
      ['Section', 'Item', 'Value', 'Detail'],
      ...data.stats.map(([l, v, d]) => ['Summary', l, v, d]),
      ...data.volume.map((b) => ['Volume', b.label, b.value, 'kg']),
      ...STRENGTH.map(([n, a, b, c]) => ['Strength', n, `${a} -> ${b}`, c]),
      ...data.muscles.map(([n, p]) => ['Muscle balance', n, `${p}%`, '']),
    ];
    downloadFile(`alceo-progress-${rangeId}.csv`, toCsv(rows));
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Your training over time</p>
          <h1 className="topbar__title">Progress</h1>
        </div>
        <TopActions />
      </header>

      <div className="toolbar">
        <div className="toolbar__left">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`select${r.id === rangeId ? ' select--active' : ''}`}
              onClick={() => setRangeId(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button className="select" onClick={exportReport}>Export report</button>
      </div>

      <div className="kpis">
        {data.stats.map(([label, value, delta]) => (
          <div key={label} className="panel kpi">
            <p className="muted">{label}</p>
            <p className="kpi__value">{value}</p>
            <p className="accent kpi__delta">{delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid--progress">
        <section className="panel">
          <div className="panel__head">
            <div>
              <h3 className="panel__title">Weekly volume</h3>
              <p className="panel__sub">Total kg lifted per {rangeId.endsWith('w') ? 'week' : 'month'}</p>
            </div>
            <span className="muted">kg</span>
          </div>
          <div className="bars bars--tall">
            {data.volume.map((b, i) => (
              <div key={b.label} className="bars__col">
                <div
                  className={`bar${i === data.volume.length - 1 ? ' bar--accent' : ''}`}
                  style={{ height: `${(b.value / max) * 100}%` }}
                  title={`${b.value.toLocaleString()} kg`}
                />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Personal records</h3>
            <button className="link" onClick={() => setAllRecords((a) => !a)}>{allRecords ? 'Show less' : 'See all'}</button>
          </div>
          <ul className="records">
            {(allRecords ? RECORDS : RECORDS.slice(0, 5)).map(([name, date, result]) => (
              <li key={name}>
                <span className="records__star">★</span>
                <div>
                  <strong>{name}</strong>
                  <p className="muted">{date}</p>
                </div>
                <span>{result}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel__head">
            <div>
              <h3 className="panel__title">Strength by exercise</h3>
              <p className="panel__sub">Best set, start of period → now</p>
            </div>
            <select className="select" aria-label="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)}>
              <option>All</option>
              {STRENGTH.map((r) => <option key={r[0]}>{r[0]}</option>)}
            </select>
          </div>
          <table className="table">
            <thead>
              <tr><th>Exercise</th><th>{range.period}</th><th>Now</th><th>Change</th></tr>
            </thead>
            <tbody>
              {strengthRows.map(([name, then, now, change]) => (
                <tr key={name}>
                  <td className="strong">{name}</td>
                  <td className="muted">{then}</td>
                  <td>{now}</td>
                  <td className={change.startsWith('+') ? 'accent' : 'neg'}>{change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3 className="panel__title">Muscle group balance</h3>
          <p className="panel__sub">Share of sets, last {range.label}</p>
          <ul className="muscles">
            {data.muscles.map(([name, pct]) => (
              <li key={name}>
                <div className="muscles__row"><span>{name}</span><span className="muted">{pct}%</span></div>
                <div className="muscles__track"><div className="muscles__fill" style={{ width: `${pct * 2.5}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
