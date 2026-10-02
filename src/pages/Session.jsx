import { useEffect, useState } from 'react';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import SetEditor from '../components/SetEditor.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { patch, post } from '../api/client.js';
import { fmtVolume } from '../lib/units.js';
import { countDone, countSets, isWarmupExercise, toDate, workoutName, workoutVolume } from '../lib/workouts.js';
import { formatLong } from '../utils/dates.js';

const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function Session({ workout }) {
  const { units, upsertWorkout, refreshWorkout, go, toast } = useApp();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const started = toDate(workout.started_at) ?? new Date();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const total = countSets(workout);
  const done = countDone(workout);
  const ordered = [...workout.exercises].sort((a, b) => a.sort_order - b.sort_order);
  const groups = [
    ['Warm-up', ordered.filter(isWarmupExercise)],
    ['Main workout', ordered.filter((e) => !isWarmupExercise(e))],
  ];

  const saveSet = async (s, changes) => {
    try {
      await patch(`/workouts/${workout.id}/sets/${s.id}`, changes);
    } catch (e) {
      toast(e.message);
    }
    await refreshWorkout(workout.id);
  };

  const toggle = (s) => saveSet(s, { completed_at: s.completed_at ? null : new Date().toISOString() });

  const close = async (action) => {
    setBusy(true);
    try {
      const w = await post(`/workouts/${workout.id}/${action}`);
      upsertWorkout(w);
      if (action === 'finish') toast(`Session saved · ${countDone(w)}/${countSets(w)} sets · ${fmtVolume(workoutVolume(w), units)}`);
      else toast('Workout abandoned');
      go('home');
    } catch (e) {
      toast(e.message);
      setBusy(false);
    }
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(started)}</p>
          <h1 className="topbar__title">{workoutName(workout)}</h1>
        </div>
        <TopActions />
      </header>

      <section className="panel session">
        <div className="session__bar">
          <div className="session__stats">
            <div><strong>{fmtClock(now - started.getTime())}</strong><span className="muted">Elapsed</span></div>
            <div><strong>{done}/{total}</strong><span className="muted">Sets done</span></div>
            <ConditioningBubble>{workout.ai_query_id ? '✦ AI-generated' : 'Custom'}</ConditioningBubble>
          </div>
          <div className="session__actions">
            <button className="select" onClick={() => go('workout')}>Back</button>
            {confirmAbandon ? (
              <>
                <button className="select" onClick={() => setConfirmAbandon(false)}>Keep going</button>
                <button className="btn-danger" disabled={busy} onClick={() => close('abandon')}>Abandon</button>
              </>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmAbandon(true)}>Abandon</button>
            )}
            <button className="btn btn--lime" disabled={busy} onClick={() => close('finish')}>Finish workout</button>
          </div>
        </div>
        <div className="progressbar"><div style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>

        {groups.map(([label, rows]) => rows.length > 0 && (
          <div key={label}>
            <h4 className="flabel">{label.toUpperCase()}</h4>
            <ul className="session__list">
              {rows.map((e) => (
                <li key={e.id} className="session__item">
                  <div>
                    <strong>{e.exercise_name}</strong>
                    {e.notes && <p className="muted">{e.notes}</p>}
                  </div>
                  <div className="session__sets">
                    {e.sets.map((s) => (
                      <div key={s.id} className="session__set">
                        <SetEditor
                          key={`${s.id}-${s.weight_kg}-${s.reps}-${s.rpe}-${s.duration_seconds}`}
                          set={s}
                          units={units}
                          cardio={e.category === 'cardio'}
                          compact
                          onSave={(changes) => saveSet(s, changes)}
                        />
                        <button
                          className={`setbox${s.completed_at ? ' setbox--on' : ''}`}
                          aria-pressed={Boolean(s.completed_at)}
                          aria-label={`${e.exercise_name} set ${s.set_number} done`}
                          onClick={() => toggle(s)}
                        >
                          {s.completed_at ? '✓' : ''}
                        </button>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
