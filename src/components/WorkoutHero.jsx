import { countSets, plannedRpe, splitExercises, summarizeSets, workoutName } from '../lib/workouts.js';

export default function WorkoutHero({ workout, units, onStart, onModify, onGenerate, generating }) {
  if (!workout) {
    return (
      <section className="hero hero--rest">
        <p className="hero__eyebrow">UP NEXT</p>
        <h2 className="hero__title">No workout planned</h2>
        <p className="hero__desc">Let AI build your next session from your filters, or put one together yourself.</p>
        <div className="hero__actions hero__actions--top">
          <button className="btn btn--dark" onClick={onGenerate} disabled={generating}>
            {generating ? 'Generating…' : '✦ Generate with AI'}
          </button>
          <button className="btn btn--outline" onClick={onModify}>Build my own</button>
        </div>
      </section>
    );
  }

  const { warmup, main } = splitExercises(workout);
  const inProgress = workout.status === 'in_progress';
  const rpe = plannedRpe(workout);

  return (
    <section className="hero">
      <div className="hero__main">
        <span className="chip chip--dark">{workout.ai_query_id ? '✦ AI-generated for you' : 'Built by you'}</span>
        <p className="hero__eyebrow">{inProgress ? 'IN PROGRESS' : 'UP NEXT'}</p>
        <h2 className="hero__title">{workoutName(workout)}</h2>
        {workout.notes && <p className="hero__desc">{workout.notes}</p>}
        <div className="hero__tags">
          <span className="tag">{countSets(workout)} sets</span>
          <span className="tag">{warmup.length ? 'Warm-up + ' : ''}{main.length} exercises</span>
          {rpe != null && <span className="tag">Target RPE ~{rpe}</span>}
        </div>
        <div className="hero__actions">
          <button className="btn btn--dark" onClick={onStart}>{inProgress ? 'Resume workout →' : 'Start workout →'}</button>
          <button className="btn btn--outline" onClick={onModify}>Modify</button>
        </div>
      </div>
      <div className="hero__list">
        {warmup.length > 0 && (
          <>
            <h4>WARM-UP</h4>
            <ul>
              {warmup.map((e) => (
                <li key={e.id}><span>{e.exercise_name}</span><span>{summarizeSets(e.sets, units)}</span></li>
              ))}
            </ul>
          </>
        )}
        <h4>MAIN · {main.length} exercises</h4>
        <ul>
          {main.map((e) => (
            <li key={e.id}><span>{e.exercise_name}</span><span>{summarizeSets(e.sets, units)}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
