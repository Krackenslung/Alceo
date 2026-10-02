import { useState } from 'react';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import ExercisePicker from '../components/ExercisePicker.jsx';
import PastSessions from '../components/PastSessions.jsx';
import SetEditor from '../components/SetEditor.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { del, patch, post, put } from '../api/client.js';
import { EQUIPMENT_LABEL } from '../data/filters.js';
import {
  countSets, isWarmupExercise, lastPerformance, setLabel, summarizeSets, toDate, warmupCount, workoutName,
} from '../lib/workouts.js';
import { formatCompact } from '../utils/dates.js';

function ExerciseRows({ label, rows, workout, number, onMove, onRemove }) {
  const { units, history, refreshWorkout, toast } = useApp();
  const [openId, setOpenId] = useState(null);

  const run = async (fn) => {
    try {
      await fn();
    } catch (e) {
      toast(e.message);
    }
    await refreshWorkout(workout.id);
  };

  if (!rows.length) return null;
  return (
    <>
      <tr className="table__section"><td colSpan={6}>{label}</td></tr>
      {rows.map((e) => {
        const last = lastPerformance(history, e.exercise_id, workout.id);
        const warm = warmupCount(e.sets);
        const open = openId === e.id;
        const cardio = e.category === 'cardio';
        return [
          <tr key={e.id}>
            <td className="muted">{number(e)}</td>
            <td>
              <span className="strong">{e.exercise_name}</span>
              {e.notes && <p className="muted row-note">{e.notes}</p>}
            </td>
            <td className="muted">{e.equipment ? EQUIPMENT_LABEL[e.equipment] ?? e.equipment : '—'}</td>
            <td>
              {summarizeSets(e.sets, units)}
              {warm > 0 && !isWarmupExercise(e) && <span className="muted"> · +{warm} warm-up</span>}
            </td>
            <td className="muted">
              {last ? (
                <span className="accent" title={formatCompact(toDate(last.workout.finished_at))}>
                  {last.best ? setLabel(last.best, units) : summarizeSets(last.exercise.sets, units)}
                </span>
              ) : '—'}
            </td>
            <td className="row-actions">
              <button className="row-x" aria-label={`Move ${e.exercise_name} up`} onClick={() => onMove(e.id, -1)}>↑</button>
              <button className="row-x" aria-label={`Move ${e.exercise_name} down`} onClick={() => onMove(e.id, 1)}>↓</button>
              <button className={`row-x${open ? ' accent' : ''}`} aria-label={`Edit sets of ${e.exercise_name}`} onClick={() => setOpenId(open ? null : e.id)}>✎</button>
              <button className="row-x" aria-label={`Remove ${e.exercise_name}`} onClick={() => onRemove(e.id)}>×</button>
            </td>
          </tr>,
          open && (
            <tr key={`${e.id}-sets`} className="sets-edit">
              <td />
              <td colSpan={5}>
                {e.sets.map((s) => (
                  <SetEditor
                    key={`${s.id}-${s.set_number}-${s.weight_kg}-${s.reps}-${s.rpe}-${s.is_warmup}`}
                    set={s}
                    units={units}
                    cardio={cardio}
                    onSave={(changes) => run(() => patch(`/workouts/${workout.id}/sets/${s.id}`, changes))}
                    onDelete={() => run(() => del(`/workouts/${workout.id}/sets/${s.id}`))}
                  />
                ))}
                <button
                  className="link"
                  onClick={() => {
                    const prev = e.sets.filter((s) => !s.is_warmup).at(-1);
                    const copy = prev ? { reps: prev.reps, weight_kg: prev.weight_kg, duration_seconds: prev.duration_seconds, distance_m: prev.distance_m, rpe: prev.rpe } : {};
                    run(() => post(`/workouts/${workout.id}/exercises/${e.id}/sets`, copy));
                  }}
                >
                  + Add set
                </button>
              </td>
            </tr>
          ),
        ];
      })}
    </>
  );
}

function WorkoutDetail({ workout }) {
  const { refreshWorkout, upsertWorkout, removeWorkout, startWorkout, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ordered = [...workout.exercises].sort((a, b) => a.sort_order - b.sort_order);
  const warmup = ordered.filter(isWarmupExercise);
  const main = ordered.filter((e) => !isWarmupExercise(e));

  const call = async (fn) => {
    try {
      const result = await fn();
      if (result?.exercises) upsertWorkout(result);
      else await refreshWorkout(workout.id);
    } catch (e) {
      toast(e.message);
    }
  };

  const move = (id, dir) => {
    const ids = ordered.map((e) => e.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    call(() => put(`/workouts/${workout.id}/exercises/order`, { workout_exercise_ids: ids }));
  };

  const saveName = async (e) => {
    e.preventDefault();
    const name = renaming.trim();
    setRenaming(null);
    if (name !== (workout.name ?? '')) await call(() => patch(`/workouts/${workout.id}`, { name: name || null }));
  };

  const remove = async () => {
    try {
      await del(`/workouts/${workout.id}`);
      removeWorkout(workout.id);
      toast('Workout deleted');
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <section className="panel detail">
      <div className="detail__head">
        <div>
          <p className="muted">
            {workout.status === 'in_progress' ? 'In progress' : 'Planned'} · created {formatCompact(toDate(workout.created_at))} · {countSets(workout)} sets
          </p>
          <div className="detail__title">
            {renaming !== null ? (
              <form onSubmit={saveName}>
                <input className="title-input" autoFocus maxLength={100} value={renaming} onChange={(e) => setRenaming(e.target.value)} onBlur={saveName} />
              </form>
            ) : (
              <h2>
                <button className="title-btn" title="Rename" onClick={() => setRenaming(workout.name ?? '')}>{workoutName(workout)}</button>
              </h2>
            )}
            <ConditioningBubble>{workout.ai_query_id ? '✦ AI' : 'Custom'}</ConditioningBubble>
          </div>
          {workout.notes && <p className="muted detail__notes">{workout.notes}</p>}
        </div>
        <div className="detail__actions">
          {workout.status === 'planned' && (confirmDelete ? (
            <span className="confirm">
              <button className="select" onClick={() => setConfirmDelete(false)}>Keep</button>
              <button className="btn-danger" onClick={remove}>Delete</button>
            </span>
          ) : (
            <button className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>Delete</button>
          ))}
          <button className="btn btn--ghost" onClick={() => setAdding((a) => !a)}>{adding ? '× Cancel' : '+ Add exercise'}</button>
          <button className="btn btn--white" onClick={() => startWorkout(workout)}>
            {workout.status === 'in_progress' ? 'Resume →' : 'Start workout →'}
          </button>
        </div>
      </div>

      {adding && (
        <ExercisePicker
          onCancel={() => setAdding(false)}
          onAdd={async (body) => {
            await call(() => post(`/workouts/${workout.id}/exercises`, body));
            setAdding(false);
          }}
        />
      )}

      {ordered.length === 0 ? (
        <p className="panel__sub">No exercises yet. Add some from the catalog.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>#</th><th>Exercise</th><th>Equipment</th><th>Sets</th><th>Last time</th><th /></tr>
          </thead>
          <tbody>
            <ExerciseRows label="WARM-UP" rows={warmup} workout={workout} number={(e) => `W${warmup.indexOf(e) + 1}`} onMove={move} onRemove={(id) => call(() => del(`/workouts/${workout.id}/exercises/${id}`))} />
            <ExerciseRows label="MAIN WORKOUT" rows={main} workout={workout} number={(e) => main.indexOf(e) + 1} onMove={move} onRemove={(id) => call(() => del(`/workouts/${workout.id}/exercises/${id}`))} />
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function Workout() {
  const { open, selected, selectWorkout, generate, generating, upsertWorkout, toast, filters } = useApp();
  const [request, setRequest] = useState('');
  const [newName, setNewName] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    try {
      const w = await post('/workouts', { name: newName.trim() || null });
      upsertWorkout(w);
      selectWorkout(w.id);
      setNewName(null);
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">
            {filters.sport !== 'None' ? `${filters.sport} · ` : ''}{filters.focus ?? 'No focus set'} · {open.length} planned
          </p>
          <h1 className="topbar__title">Workout</h1>
        </div>
        <TopActions />
      </header>

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); generate({ request }); }}>
        <input
          className="request-input"
          maxLength={1000}
          placeholder="Ask the AI (optional): e.g. upper body, 45 minutes, go easy on the knees"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
        />
        <div className="toolbar__left">
          <button type="button" className="btn btn--ghost" onClick={() => setNewName(newName === null ? '' : null)}>
            {newName === null ? '+ New workout' : '× Cancel'}
          </button>
          <button type="submit" className="btn btn--lime" disabled={generating}>
            {generating ? 'Generating…' : '✦ Generate with AI'}
          </button>
        </div>
      </form>

      {newName !== null && (
        <form className="panel picker picker--panel" onSubmit={create}>
          <input autoFocus maxLength={100} placeholder="Workout name, e.g. Leg Day" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn btn--lime" type="submit">Create workout</button>
        </form>
      )}

      {open.length > 0 ? (
        <div className="queue">
          {open.map((w) => (
            <button
              key={w.id}
              className={`daycard${selected?.id === w.id ? ' daycard--selected' : ''}`}
              onClick={() => selectWorkout(w.id)}
            >
              <div className="daycard__top">
                <span>{w.ai_query_id ? '✦ AI' : 'CUSTOM'}</span>
                <span>{formatCompact(toDate(w.created_at))}</span>
              </div>
              <p className="daycard__name">{workoutName(w)}</p>
              <p className="daycard__meta">{w.exercises.length} exercises · {countSets(w)} sets</p>
              <span className={`status status--${w.status === 'in_progress' ? 'today' : 'planned'}`}>
                {w.status === 'in_progress' ? 'In progress' : 'Planned'}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <section className="panel detail">
          <p className="panel__sub">No planned workouts. Generate one with AI or create your own.</p>
        </section>
      )}

      {selected && (
        <>
          <WorkoutDetail key={selected.id} workout={selected} />
          <PastSessions workout={selected} />
        </>
      )}
    </main>
  );
}
