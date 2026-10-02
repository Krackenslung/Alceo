import { useApp } from '../AppContext.jsx';
import { DAY_LETTER, getWeek, isSameDay, ymd } from '../utils/dates.js';

export default function WeekCard({ today, selectedDate, onSelect }) {
  const { weekStart, resolve, history } = useApp();
  const week = getWeek(today, weekStart);
  const completed = new Set(history.map((h) => h.dateKey).filter(Boolean));
  const planned = week.filter((d) => resolve(d));
  const isDone = (d) => resolve(d) && (completed.has(ymd(d)) || (d < today && !isSameDay(d, today)));
  const done = planned.filter(isDone).length;

  return (
    <section className="panel">
      <h3 className="panel__title">This week</h3>
      <p className="panel__sub">{done} of {planned.length} sessions done</p>
      <div className="week">
        {week.map((d) => {
          const isToday = isSameDay(d, today);
          const selected = isSameDay(d, selectedDate);
          const complete = isDone(d);
          return (
            <div key={d.toISOString()} className="week__col">
              <span className="week__letter">{DAY_LETTER[d.getDay()]}</span>
              <button
                className={`dot${complete ? ' dot--done' : ''}${isToday ? ' dot--today' : ''}${selected ? ' dot--selected' : ''}`}
                onClick={() => onSelect(d)}
                aria-pressed={selected}
                aria-label={d.toDateString()}
              >
                {complete ? '✓' : d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
