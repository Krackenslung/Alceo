import { useState } from 'react';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import DayCard from '../components/DayCard.jsx';
import PastSessions from '../components/PastSessions.jsx';
import { getWorkoutForDate } from '../data/workouts.js';
import { formatShort, getWeek, isSameDay } from '../utils/dates.js';

const statusFor = (date, today, workout) => {
  if (!workout) return '—';
  if (isSameDay(date, today)) return 'Today';
  return date < today ? 'Done' : 'Planned';
};

function Section({ label, rows, startIndex, prefix }) {
  return (
    <>
      <tr className="table__section"><td colSpan={7}>{label}</td></tr>
      {rows.map((e, i) => (
        <tr key={e.name}>
          <td className="muted">{prefix ? `${prefix}${i + 1}` : startIndex + i + 1}</td>
          <td className="strong">{e.name}</td>
          <td className="muted">{e.equipment}</td>
          <td>{e.sets}</td>
          <td>{e.weight}</td>
          <td className="muted">
            {e.last.includes('·') ? <span className="accent">{e.last}</span> : e.last}
          </td>
          <td className="muted">{e.rest}</td>
        </tr>
      ))}
    </>
  );
}

export default function Workout({ today, selectedDate, onSelectDate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const base = new Date(today);
  base.setDate(today.getDate() + weekOffset * 7);
  const week = getWeek(base);
  const workout = getWorkoutForDate(selectedDate);

  // Move to another week while keeping the same weekday selected.
  const shiftWeek = (delta) => {
    setWeekOffset((o) => o + delta);
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    onSelectDate(d);
  };
  const goToThisWeek = () => {
    setWeekOffset(0);
    onSelectDate(today);
  };

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">Week of {formatShort(week[0])} – {formatShort(week[6])}</p>
          <h1 className="topbar__title">Workout</h1>
        </div>
        <div className="topbar__actions">
          <button className="icon-btn" aria-label="Settings">⚙</button>
          <span className="avatar">JM</span>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar__left">
          <button className="icon-btn icon-btn--sq" aria-label="Previous week" onClick={() => shiftWeek(-1)}>‹</button>
          <button className="select" onClick={goToThisWeek}>This week</button>
          <button className="icon-btn icon-btn--sq" aria-label="Next week" onClick={() => shiftWeek(1)}>›</button>
          <span className="muted toolbar__focus">
            Focus: <strong>Soccer (primary) · Strength (secondary)</strong>
          </span>
        </div>
        <button className="btn btn--lime">✦ Generate week with AI</button>
      </div>

      <div className="daycards">
        {week.map((d) => {
          const wk = getWorkoutForDate(d);
          return (
            <DayCard
              key={d.toISOString()}
              date={d}
              workout={wk}
              status={statusFor(d, today, wk)}
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
                <button className="btn btn--ghost">+ Add exercise</button>
                <button className="btn btn--white">Start workout →</button>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Exercise</th><th>Machine / equipment</th><th>Sets × reps</th>
                  <th>Weight</th><th>Last time</th><th>Rest</th>
                </tr>
              </thead>
              <tbody>
                <Section label="WARM-UP · 8 MIN" rows={workout.warmup} prefix="W" />
                <Section label="MAIN WORKOUT" rows={workout.main} startIndex={0} />
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
