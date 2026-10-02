import WeekCalendar from '../components/WeekCalendar.jsx';
import ConditioningBubble from '../components/ConditioningBubble.jsx';
import { getWorkoutForDate } from '../data/workouts.js';
import { formatLong, isSameDay } from '../utils/dates.js';

export default function Home({ today, selectedDate, onSelectDate, onModify }) {
  const workout = getWorkoutForDate(selectedDate);
  const title = isSameDay(selectedDate, today) ? "Today's Workout" : `${formatLong(selectedDate)}'s Workout`;

  return (
    <main className="page">
      <header className="page__header">
        <h1>Home</h1>
      </header>

      <WeekCalendar today={today} selectedDate={selectedDate} onSelect={onSelectDate} />

      <section className="card">
        <h2 className="card__eyebrow">{title}</h2>
        {workout ? (
          <>
            <div className="card__row">
              <h3 className="card__title">{workout.name}</h3>
              <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
            </div>
            <p className="card__meta">{workout.exercises.length} exercises</p>
            <button className="btn" onClick={() => onModify(selectedDate)}>
              Modify
            </button>
          </>
        ) : (
          <p className="card__meta">Rest day</p>
        )}
      </section>
    </main>
  );
}
