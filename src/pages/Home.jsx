import WorkoutHero from '../components/WorkoutHero.jsx';
import WeekCard from '../components/WeekCard.jsx';
import { getWorkoutForDate } from '../data/workouts.js';
import { formatLong, greeting, isSameDay } from '../utils/dates.js';

const SESSIONS = [
  ['Upper Body Strength', 'Thu, Sep 24', '52 min', '8,420 kg', '8/10'],
  ['Agility & Conditioning', 'Tue, Sep 22', '38 min', '5 drills', '7/10'],
  ['Full Body Mobility', 'Mon, Sep 21', '25 min', '—', '4/10'],
];
const VOLUME = [55, 62, 48, 70, 66, 100];

export default function Home({ today, selectedDate, onSelectDate, onModify }) {
  const workout = getWorkoutForDate(selectedDate);

  return (
    <main className="main">
      <header className="topbar">
        <div>
          <p className="topbar__date">{formatLong(today)}</p>
          <h1 className="topbar__title">{greeting(today)}, Jesus — ready to train?</h1>
        </div>
        <div className="topbar__actions">
          <button className="icon-btn" aria-label="Settings">⚙</button>
          <span className="avatar">JM</span>
        </div>
      </header>

      <div className="grid">
        <WorkoutHero
          workout={workout}
          isToday={isSameDay(selectedDate, today)}
          onModify={() => onModify(selectedDate)}
        />

        <div className="col-right">
          <section className="panel">
            <div className="panel__head">
              <h3 className="panel__title">This week’s focus</h3>
              <button className="link">Edit</button>
            </div>
            <div className="pills">
              <span className="pill pill--accent">● Primary · Soccer</span>
              <span className="pill">Secondary · Strength</span>
              <span className="pill">My gym · 14 machines</span>
            </div>
          </section>
          <WeekCard today={today} selectedDate={selectedDate} onSelect={onSelectDate} />
        </div>

        <section className="panel sessions">
          <div className="panel__head">
            <h3 className="panel__title">Recent sessions</h3>
            <button className="link">See all</button>
          </div>
          <table>
            <thead>
              <tr><th>Session</th><th>Date</th><th>Duration</th><th>Volume</th><th>Effort</th></tr>
            </thead>
            <tbody>
              {SESSIONS.map((r) => (
                <tr key={r[0]}>
                  <td className="strong">{r[0]}</td>
                  {r.slice(1).map((c, i) => <td key={i}>{c}</td>)}
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
