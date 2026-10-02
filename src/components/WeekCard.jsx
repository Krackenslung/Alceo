import { getWeek, isSameDay } from '../utils/dates.js';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekCard({ today, selectedDate, onSelect }) {
  const week = getWeek(today);
  const done = week.filter((d) => d < today && !isSameDay(d, today) && d.getDay() !== 0).length;
  const planned = week.filter((d) => d.getDay() !== 0).length;

  return (
    <section className="panel">
      <h3 className="panel__title">This week</h3>
      <p className="panel__sub">{done} of {planned} sessions done</p>
      <div className="week">
        {week.map((d, i) => {
          const isToday = isSameDay(d, today);
          const selected = isSameDay(d, selectedDate);
          const complete = d < today && !isToday && d.getDay() !== 0;
          return (
            <div key={d.toISOString()} className="week__col">
              <span className="week__letter">{LETTERS[i]}</span>
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
