import { useApp } from '../AppContext.jsx';
import { toDate } from '../lib/workouts.js';
import { DAY_LETTER, getWeek, isSameDay, ymd } from '../utils/dates.js';

export default function WeekCard() {
  const { today, weekStart, history, filters } = useApp();
  const week = getWeek(today, weekStart);
  const doneDays = new Set(history.map((w) => ymd(toDate(w.finished_at))));
  const done = week.filter((d) => doneDays.has(ymd(d))).length;
  const target = filters.days.length;

  return (
    <section className="panel">
      <h3 className="panel__title">This week</h3>
      <p className="panel__sub">
        {target ? `${done} of ${target} planned training days done` : `${done} training day${done === 1 ? '' : 's'} so far`}
      </p>
      <div className="week">
        {week.map((d) => {
          const complete = doneDays.has(ymd(d));
          const isToday = isSameDay(d, today);
          return (
            <div key={d.toISOString()} className="week__col">
              <span className="week__letter">{DAY_LETTER[d.getDay()]}</span>
              <span
                className={`dot${complete ? ' dot--done' : ''}${isToday ? ' dot--today' : ''}`}
                aria-label={`${d.toDateString()}${complete ? ', trained' : ''}`}
              >
                {complete ? '✓' : d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
