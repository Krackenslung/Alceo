import { DAY_LABELS, getWeek, isSameDay } from '../utils/dates.js';

export default function WeekCalendar({ today, selectedDate, onSelect }) {
  const week = getWeek(today);
  return (
    <div className="week" role="tablist" aria-label="Week">
      {week.map((d) => {
        const selected = isSameDay(d, selectedDate);
        const isToday = isSameDay(d, today);
        return (
          <button
            key={d.toISOString()}
            role="tab"
            aria-selected={selected}
            className={`day${selected ? ' day--selected' : ''}${isToday ? ' day--today' : ''}`}
            onClick={() => onSelect(d)}
          >
            <span className="day__label">{DAY_LABELS[d.getDay()]}</span>
            <span className="day__num">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
