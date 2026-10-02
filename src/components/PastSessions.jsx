import { useState } from 'react';
import { useApp } from '../AppContext.jsx';
import {
  avgRpe, bestSet, countDone, countSets, durationMinutes, setLabel, toDate, workoutName, workoutVolume,
} from '../lib/workouts.js';
import { fmtVolume, fmtWeight } from '../lib/units.js';
import { formatCompact } from '../utils/dates.js';

const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);

export default function PastSessions({ workout }) {
  const { history, units } = useApp();
  const name = workoutName(workout).toLowerCase();
  const sessions = history.filter((w) => workoutName(w).toLowerCase() === name && w.id !== workout.id);
  const [activeId, setActiveId] = useState(null);
  const [visible, setVisible] = useState(4);
  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  if (!sessions.length) {
    return (
      <section className="panel past" id="past-sessions">
        <h3 className="past__title">Past {workoutName(workout)} sessions</h3>
        <p className="panel__sub">No completed sessions with this name yet.</p>
      </section>
    );
  }

  const previousOf = (s) => sessions[sessions.indexOf(s) + 1];
  const prev = previousOf(active);

  return (
    <section className="panel past" id="past-sessions">
      <div className="past__head">
        <div>
          <h3 className="past__title">Past {workoutName(workout)} sessions</h3>
          <p className="panel__sub">Completed workouts with the same name · newest first</p>
        </div>
      </div>

      <div className="past__body">
        <div className="past__list">
          {sessions.slice(0, visible).map((s, i) => {
            const before = previousOf(s);
            const delta = before ? pct(workoutVolume(s), workoutVolume(before)) : null;
            const minutes = durationMinutes(s);
            return (
              <button
                key={s.id}
                className={`past__item${s.id === active.id ? ' past__item--active' : ''}`}
                onClick={() => setActiveId(s.id)}
              >
                <div className="past__row">
                  <strong>{formatCompact(toDate(s.finished_at))}</strong>
                  <span className={i === 0 ? 'accent' : 'muted'}>{i === 0 ? 'Last time' : `${i + 1} sessions ago`}</span>
                </div>
                <div className="past__row">
                  <span className="muted">{minutes ? `${minutes} min · ` : ''}{fmtVolume(workoutVolume(s), units)}</span>
                  <span className={delta > 0 ? 'accent' : delta < 0 ? 'neg' : 'muted'}>
                    {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}%`}
                  </span>
                </div>
              </button>
            );
          })}
          {visible < sessions.length && (
            <button className="link past__more" onClick={() => setVisible(sessions.length)}>Load older sessions</button>
          )}
        </div>

        <div className="past__detail">
          <div className="past__detail-head">
            <div>
              <strong>{formatCompact(toDate(active.finished_at))} · {workoutName(active)}</strong>
              <p className="muted">
                {durationMinutes(active) ?? '—'} min · effort {avgRpe(active) != null ? `RPE ${avgRpe(active)}` : '—'}
                {active.notes ? ` · note: “${active.notes}”` : ''}
              </p>
            </div>
            <div className="past__totals">
              <div><strong>{fmtVolume(workoutVolume(active), units)}</strong><span className="muted">Volume</span></div>
              <div><strong>{countDone(active)}/{countSets(active)}</strong><span className="muted">Sets done</span></div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr><th>Exercise</th><th>Sets done</th><th>Best set</th><th>vs previous</th></tr>
            </thead>
            <tbody>
              {active.exercises.map((e) => {
                const best = bestSet(e.sets);
                const before = prev?.exercises.find((x) => x.exercise_id === e.exercise_id);
                const prevBest = before ? bestSet(before.sets) : null;
                const diff = best && prevBest ? Math.round((best.weight_kg - prevBest.weight_kg) * 100) / 100 : null;
                return (
                  <tr key={e.id}>
                    <td className="strong">{e.exercise_name}</td>
                    <td className="muted">{e.sets.filter((s) => s.completed_at).length}/{e.sets.length}</td>
                    <td>{best ? setLabel(best, units) : '—'}</td>
                    <td className={diff > 0 ? 'accent' : diff < 0 ? 'neg' : 'muted'}>
                      {diff == null ? '—' : diff === 0 ? '=' : `${diff > 0 ? '+' : '−'}${fmtWeight(Math.abs(diff), units)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
