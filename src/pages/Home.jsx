import { useState } from 'react';
import WorkoutHero from '../components/WorkoutHero.jsx';
import WeekCard from '../components/WeekCard.jsx';
import TopActions from '../components/TopActions.jsx';
import { useApp } from '../AppContext.jsx';
import { formatLong, greeting, isSameDay } from '../utils/dates.js';

const VOLUME = [55, 62, 48, 70, 66, 100];

export default function Home({ today, selectedDate, onSelectDate, onModify }) {
  const { resolve, history, filters, profile, go, startSession } = useApp();
  const [showAll, setShowAll] = useState(false);
  const workout = resolve(selectedDate);
  const sessions = showAll ? history : history.slice(0, 3);
  const sport = filters.primary !== 'None' ? filters.primary : 'No sport';

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(today)}</p>
          <h1 className="topbar__title">{greeting(today)}, {profile.info.first} — ready to train?</h1>
        </div>
        <TopActions />
      </header>

      <div className="grid">
        <WorkoutHero
          workout={workout}
          isToday={isSameDay(selectedDate, today)}
          onModify={() => onModify(selectedDate)}
          onStart={startSession}
        />

        <div className="col-right">
          <section className="panel">
            <div className="panel__head">
              <h3 className="panel__title">This week’s focus</h3>
              <button className="link" onClick={() => go('filters')}>Edit</button>
            </div>
            <div className="pills">
              <span className="pill pill--accent">● Primary · {sport}</span>
              <span className="pill">Secondary · {filters.secondary}</span>
              <span className="pill">My gym · {filters.machines.length} machines</span>
            </div>
          </section>
          <WeekCard today={today} selectedDate={selectedDate} onSelect={onSelectDate} />
        </div>

        <section className="panel sessions">
          <div className="panel__head">
            <h3 className="panel__title">Recent sessions</h3>
            {history.length > 3 && (
              <button className="link" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show less' : 'See all'}</button>
            )}
          </div>
          <table>
            <thead>
              <tr><th>Session</th><th>Date</th><th>Duration</th><th>Volume</th><th>Effort</th></tr>
            </thead>
            <tbody>
              {sessions.map((r) => (
                <tr key={r.id}>
                  <td className="strong">{r.name}</td>
                  <td>{r.date}</td>
                  <td>{r.duration}</td>
                  <td>{r.volume}</td>
                  <td>{r.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="col-right">
          <h3 className="section-title">Your progress</h3>
          <div className="stats">
            <div className="panel stat">
              <p className="stat__value stat__value--accent">+12%</p>
              <p className="stat__label">Volume vs last week</p>
            </div>
            <div className="panel stat">
              <p className="stat__value">4 days</p>
              <p className="stat__label">Training streak</p>
            </div>
          </div>
          <section className="panel">
            <h3 className="panel__title">Weekly volume</h3>
            <p className="panel__sub">Last 6 weeks</p>
            <div className="bars">
              {VOLUME.map((v, i) => (
                <div key={i} className="bars__col">
                  <div className={`bar${i === VOLUME.length - 1 ? ' bar--accent' : ''}`} style={{ height: `${v}%` }} />
                  <span>W{i + 1}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
