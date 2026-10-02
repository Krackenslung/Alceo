import ConditioningBubble from '../components/ConditioningBubble.jsx';
import { getWorkoutForDate } from '../data/workouts.js';
import { formatLong } from '../utils/dates.js';

export default function Workout({ date }) {
  const workout = getWorkoutForDate(date);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Workout</h1>
        <p className="page__sub">{formatLong(date)}</p>
      </header>

      {workout ? (
        <section className="card">
          <div className="card__row">
            <h3 className="card__title">{workout.name}</h3>
            <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
          </div>
          <ul className="exercises">
            {workout.exercises.map((e) => (
              <li key={e.name} className="exercises__item">
                <span>{e.name}</span>
                <span className="exercises__sets">
                  {e.sets} × {e.reps}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card">
          <p className="card__meta">Rest day</p>
        </section>
      )}
    </main>
  );
}
