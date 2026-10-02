import { useState } from 'react';
import { PAST_SESSIONS } from '../data/workouts.js';

export default function PastSessions({ workout }) {
  const [activeId, setActiveId] = useState(PAST_SESSIONS[0].id);
  const [visible, setVisible] = useState(4);
  const active = PAST_SESSIONS.find((s) => s.id === activeId);

  return (
    <section className="panel past" id="past-sessions">
      <div className="past__head">
        <div>
          <h3 className="past__title">Past {workout.name} days</h3>
          <p className="panel__sub">Sessions with the same workout name · newest first</p>
        </div>
        <div className="past__filters">
          <span className="select select--static">Workout: {workout.name}</span>
          <span className="select select--static">Last 8 weeks</span>
        </div>
      </div>

      <div className="past__body">
        <div className="past__list">
          {PAST_SESSIONS.slice(0, visible).map((s) => (
            <button
              key={s.id}
              className={`past__item${s.id === activeId ? ' past__item--active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              <div className="past__row">
                <strong>{s.short}</strong>
                <span className={s.id === 'a' ? 'accent' : 'muted'}>{s.badge}</span>
              </div>
              <div className="past__row">
                <span className="muted">{s.info}</span>
                <span className={s.delta.startsWith('+') ? 'accent' : s.delta.startsWith('−') ? 'neg' : 'muted'}>
                  {s.delta}
                </span>
              </div>
            </button>
          ))}
          {visible < PAST_SESSIONS.length && (
            <button className="link past__more" onClick={() => setVisible(PAST_SESSIONS.length)}>Load older sessions</button>
          )}
        </div>

        <div className="past__detail">
          <div className="past__detail-head">
            <div>
              <strong>{active.date} · {workout.name}</strong>
              <p className="muted">{active.info.split(' · ')[0]} · effort {active.effort}/10 · note: “{active.note}”</p>
            </div>
            <div className="past__totals">
              <div><strong>{active.volume}</strong><span className="muted">Volume</span></div>
              <div><strong>{active.done}</strong><span className="muted">Completed</span></div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr><th>Exercise</th><th>Sets done</th><th>Best set</th><th>vs previous</th></tr>
            </thead>
            <tbody>
              {workout.main.map((e, i) => (
                <tr key={e.name}>
                  <td className="strong">{e.name}</td>
                  <td className="muted">{e.last === '—' ? e.sets : `${e.weight} × ${e.sets.split(' × ')[1] ?? ''}`}</td>
                  <td>{e.weight}</td>
                  <td className={i % 3 === 0 ? 'accent' : 'muted'}>{i % 3 === 0 ? '+2.5 kg' : '='}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
