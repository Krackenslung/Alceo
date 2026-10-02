import ConditioningBubble from './ConditioningBubble.jsx';

export default function WorkoutHero({ workout, isToday, onModify }) {
  if (!workout) {
    return (
      <section className="hero hero--rest">
        <p className="hero__eyebrow">{isToday ? 'TODAY' : 'THIS DAY'}</p>
        <h2 className="hero__title">Rest day</h2>
        <p className="hero__desc">Recover, stretch and refuel. Nothing scheduled.</p>
      </section>
    );
  }
  return (
    <section className="hero">
      <div className="hero__main">
        <span className="chip chip--dark">✦ AI-generated for you</span>
        <p className="hero__eyebrow">{isToday ? "TODAY'S WORKOUT" : 'WORKOUT'}</p>
        <h2 className="hero__title">{workout.name}</h2>
        <div className="hero__cond">
          <ConditioningBubble>{workout.conditioning}</ConditioningBubble>
        </div>
        <p className="hero__desc">{workout.description}</p>
        <div className="hero__tags">
          <span className="tag">{workout.duration} min</span>
          <span className="tag">
            Warm-up + {workout.main.length} exercises
          </span>
          <span className="tag">Intensity {workout.intensity}/10</span>
        </div>
        <div className="hero__actions">
          <button className="btn btn--dark">Start workout →</button>
          <button className="btn btn--outline" onClick={onModify}>
            Modify
          </button>
        </div>
      </div>
      <div className="hero__list">
        <h4>WARM-UP · 8 min</h4>
        <ul>
          {workout.warmup.map((e) => (
            <li key={e.name}><span>{e.name}</span><span>{e.sets}</span></li>
          ))}
        </ul>
        <h4>MAIN · {workout.main.length} exercises</h4>
        <ul>
          {workout.main.map((e) => (
            <li key={e.name}><span>{e.name}</span><span>{e.sets}</span></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
