import { useState } from 'react';
import { PROGRESS, RANGES, RECORDS, STRENGTH } from '../data/progress.js';

export default function Progress() {
  const [rangeId, setRangeId] = useState('12w');
  const range = RANGES.find((r) => r.id === rangeId);
  const data = PROGRESS[rangeId];
  const max = Math.max(...data.volume.map((b) => b.value));

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Your training over time</p>
          <h1 className="topbar__title">Progress</h1>
        </div>
        <div className="topbar__actions">
          <button className="icon-btn" aria-label="Settings">⚙</button>
          <span className="avatar">JM</span>
        </div>
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
        <button className="select">Export report</button>
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
            <button className="link">Volume ▾</button>
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
            <button className="link">See all</button>
          </div>
          <ul className="records">
            {RECORDS.map(([name, date, result]) => (
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
            <button className="link">Exercise ▾</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Exercise</th><th>{range.period}</th><th>Now</th><th>Change</th></tr>
            </thead>
            <tbody>
              {STRENGTH.map(([name, then, now, change]) => (
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
