import { useState } from 'react';
import WorkoutHero from '../components/WorkoutHero.jsx';
import WeekCard from '../components/WeekCard.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { EQUIPMENT_LABEL } from '../data/filters.js';
import {
  avgRpe, durationMinutes, toDate, trainingStreak, weeklyVolume, workoutName, workoutVolume,
} from '../lib/workouts.js';
import { fmtVolume } from '../lib/units.js';
import { formatCompact, formatLong, greeting } from '../utils/dates.js';

export default function Home() {
  const {
    today, user, units, weekStart, history, filters, nextWorkout, go, selectWorkout, startWorkout, generate, generating,
  } = useApp();
  const [showAll, setShowAll] = useState(false);
  const sessions = showAll ? history : history.slice(0, 5);
  const firstName = user.name.split(/\s+/)[0];

  const weeks = weeklyVolume(history, today, weekStart, 6);
  const max = Math.max(1, ...weeks.map((w) => w.value));
  const [prev, cur] = weeks.slice(-2).map((w) => w.value);
  const change = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  const streak = trainingStreak(history, today);

  const equipment = filters.equipment.length
    ? filters.equipment.map((e) => EQUIPMENT_LABEL[e] ?? e).join(', ')
    : 'Any equipment';

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(today)}</p>
          <h1 className="topbar__title">{greeting(today)}, {firstName} — ready to train?</h1>
        </div>
        <TopActions />
      </header>

      <div className="grid">
        <WorkoutHero
          workout={nextWorkout}
          units={units}
          generating={generating}
          onGenerate={() => generate({ navigate: true })}
          onStart={() => startWorkout(nextWorkout)}
          onModify={() => { if (nextWorkout) selectWorkout(nextWorkout.id); go('workout'); }}
        />

        <div className="col-right">
          <section className="panel">
            <div className="panel__head">
              <h3 className="panel__title">Your focus</h3>
              <button className="link" onClick={() => go('filters')}>Edit</button>
            </div>
            <div className="pills">
              <span className="pill pill--accent">● Sport · {filters.sport === 'None' ? 'None' : filters.sport}</span>
              {filters.focus && <span className="pill">Focus · {filters.focus}</span>}
              <span className="pill">Equipment · {equipment}</span>
              {filters.injuries.length > 0 && (
                <span className="pill">{filters.injuries.length} injur{filters.injuries.length === 1 ? 'y' : 'ies'} to respect</span>
              )}
            </div>
          </section>
          <WeekCard />
        </div>

        <section className="panel sessions">
          <div className="panel__head">
            <h3 className="panel__title">Recent sessions</h3>
            {history.length > 5 && (
              <button className="link" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show less' : 'See all'}</button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="panel__sub">No completed sessions yet. Finish a workout and it shows up here.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Session</th><th>Date</th><th>Duration</th><th>Volume</th><th>Effort</th></tr>
              </thead>
              <tbody>
                {sessions.map((w) => {
                  const rpe = avgRpe(w);
                  const minutes = durationMinutes(w);
                  const volume = workoutVolume(w);
                  return (
                    <tr key={w.id}>
                      <td className="strong">{workoutName(w)}</td>
                      <td>{formatCompact(toDate(w.finished_at))}</td>
                      <td>{minutes ? `${minutes} min` : '—'}</td>
                      <td>{volume ? fmtVolume(volume, units) : '—'}</td>
                      <td>{rpe != null ? `RPE ${rpe}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <div className="col-right">
          <h3 className="section-title">Your progress</h3>
          <div className="stats">
            <div className="panel stat">
              <p className={`stat__value${change != null && change >= 0 ? ' stat__value--accent' : ''}`}>
                {change == null ? '—' : `${change >= 0 ? '+' : ''}${change}%`}
              </p>
              <p className="stat__label">Volume vs last week</p>
            </div>
            <div className="panel stat">
              <p className="stat__value">{streak} day{streak === 1 ? '' : 's'}</p>
              <p className="stat__label">Training streak</p>
            </div>
          </div>
          <section className="panel">
            <h3 className="panel__title">Weekly volume</h3>
            <p className="panel__sub">Last 6 weeks · completed sets</p>
            <div className="bars">
              {weeks.map((w, i) => (
                <div key={w.label} className="bars__col">
                  <div
                    className={`bar${i === weeks.length - 1 ? ' bar--accent' : ''}`}
                    style={{ height: `${Math.max(2, (w.value / max) * 100)}%` }}
                    title={fmtVolume(w.value, units)}
                  />
                  <span>{w.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
