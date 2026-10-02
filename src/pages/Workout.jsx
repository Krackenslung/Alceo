import ConditioningBubble from '../components/ConditioningBubble.jsx';
import { getWorkoutForDate } from '../data/workouts.js';
import { formatLong } from '../utils/dates.js';

export default function Workout({ date }) {
  const workout = getWorkoutForDate(date);

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(date)}</p>
          <h1 className="topbar__title">Workout</h1>
        </div>
      </header>

      {workout ? (
        <section className="panel workout">
          <div className="workout__head">
            <h2 className="workout__name">{workout.name}</h2>
            <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
          </div>
          <p className="panel__sub">{workout.description}</p>
          {[['Warm-up', workout.warmup], ['Main', workout.main]].map(([label, rows]) => (
            <div key={label}>
              <h4 className="workout__section">{label}</h4>
              <ul className="rows">
                {rows.map(([n, s]) => (
                  <li key={n}><span>{n}</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : (
        <section className="panel"><p className="panel__sub">Rest day</p></section>
      )}
    </main>
  );
}
