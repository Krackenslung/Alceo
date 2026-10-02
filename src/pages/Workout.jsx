import { useState } from 'react';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import DayCard from '../components/DayCard.jsx';
import PastSessions from '../components/PastSessions.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { addDays, formatRange, formatShort, getWeek, isSameDay, ymd } from '../utils/dates.js';

function Rows({ label, rows, prefix, onRemove }) {
  return (
    <>
      <tr className="table__section"><td colSpan={8}>{label}</td></tr>
      {rows.map((e, i) => (
        <tr key={`${e.name}-${i}`}>
          <td className="muted">{prefix ? `${prefix}${i + 1}` : i + 1}</td>
          <td className="strong">{e.name}</td>
          <td className="muted">{e.equipment}</td>
          <td>{e.sets}</td>
          <td>{e.weight}</td>
          <td className="muted">{e.last.includes('·') ? <span className="accent">{e.last}</span> : e.last}</td>
          <td className="muted">{e.rest}</td>
          <td>
            {onRemove && (
              <button className="row-x" aria-label={`Remove ${e.name}`} onClick={() => onRemove(i)}>×</button>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

export default function Workout({ today, selectedDate, onSelectDate }) {
  const { weekStart, resolve, updateWorkout, generateWeek, startSession, history, filters } = useApp();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', equipment: '', sets: '3 × 10', weight: '' });

  const week = getWeek(selectedDate, weekStart);
  const workout = resolve(selectedDate);
  const completed = new Set(history.map((h) => h.dateKey));

  const statusFor = (date, wk) => {
    if (!wk) return '—';
    if (completed.has(ymd(date))) return 'Done';
    if (isSameDay(date, today)) return 'Today';
    return date < today ? 'Done' : 'Planned';
  };

  const submitExercise = (e) => {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    updateWorkout(selectedDate, (w) => ({
      ...w,
      main: [...w.main, {
        name,
        equipment: draft.equipment.trim() || 'Bodyweight',
        sets: draft.sets.trim() || '3 × 10',
        weight: draft.weight.trim() || '—',
        last: '—',
        rest: '90 s',
      }],
    }));
    setDraft({ name: '', equipment: '', sets: '3 × 10', weight: '' });
    setAdding(false);
  };

  const removeMain = (index) =>
    updateWorkout(selectedDate, (w) => ({ ...w, main: w.main.filter((_, i) => i !== index) }));

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Week of {formatRange(week)}</p>
          <h1 className="topbar__title">Workout</h1>
        </div>
        <TopActions />
      </header>

      <div className="toolbar">
        <div className="toolbar__left">
          <button className="icon-btn icon-btn--sq" aria-label="Previous week" onClick={() => onSelectDate(addDays(selectedDate, -7))}>‹</button>
          <button className="select" onClick={() => onSelectDate(today)}>This week</button>
          <button className="icon-btn icon-btn--sq" aria-label="Next week" onClick={() => onSelectDate(addDays(selectedDate, 7))}>›</button>
          <span className="muted toolbar__focus">
            Focus: <strong>{filters.primary !== 'None' ? `${filters.primary} (primary) · ` : ''}{filters.secondary} (secondary)</strong>
          </span>
        </div>
        <button className="btn btn--lime" onClick={() => generateWeek(selectedDate)}>✦ Generate week with AI</button>
      </div>

      <div className="daycards">
        {week.map((d) => {
          const wk = resolve(d);
          return (
            <DayCard
              key={d.toISOString()}
              date={d}
              workout={wk}
              status={statusFor(d, wk)}
              selected={isSameDay(d, selectedDate)}
              onSelect={() => onSelectDate(d)}
            />
          );
        })}
      </div>

      {workout ? (
        <>
          <section className="panel detail">
            <div className="detail__head">
              <div>
                <p className="muted">{formatShort(selectedDate, true)}</p>
                <div className="detail__title">
                  <h2>{workout.name}</h2>
                  <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
                </div>
              </div>
              <div className="detail__actions">
                <button
                  className="btn btn--ghost"
                  onClick={() => document.getElementById('past-sessions')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  ↻ Past {workout.name} days
                </button>
                <button className="btn btn--ghost" onClick={() => setAdding((a) => !a)}>
                  {adding ? '× Cancel' : '+ Add exercise'}
                </button>
                <button className="btn btn--white" onClick={startSession}>Start workout →</button>
              </div>
            </div>

            {adding && (
              <form className="addrow" onSubmit={submitExercise}>
                <input autoFocus placeholder="Exercise name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <input placeholder="Equipment" value={draft.equipment} onChange={(e) => setDraft({ ...draft, equipment: e.target.value })} />
                <input placeholder="Sets × reps" value={draft.sets} onChange={(e) => setDraft({ ...draft, sets: e.target.value })} />
                <input placeholder="Weight (e.g. 60 kg)" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} />
                <button className="btn btn--lime" type="submit">Add</button>
              </form>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Exercise</th><th>Machine / equipment</th><th>Sets × reps</th>
                  <th>Weight</th><th>Last time</th><th>Rest</th><th />
                </tr>
              </thead>
              <tbody>
                <Rows label="WARM-UP · 8 MIN" rows={workout.warmup} prefix="W" />
                <Rows label="MAIN WORKOUT" rows={workout.main} onRemove={removeMain} />
              </tbody>
            </table>
          </section>
          <PastSessions workout={workout} />
        </>
      ) : (
        <section className="panel"><p className="panel__sub">Rest day — nothing scheduled.</p></section>
      )}
    </main>
  );
}
