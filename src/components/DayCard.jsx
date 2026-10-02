import { DAY_ABBR } from '../utils/dates.js';

export default function DayCard({ date, workout, status, selected, onSelect }) {
  return (
    <button className={`daycard${selected ? ' daycard--selected' : ''}`} onClick={onSelect}>
      <div className="daycard__top">
        <span>{DAY_ABBR[date.getDay()]}</span>
        <span className="daycard__num">{date.getDate()}</span>
      </div>
      <p className="daycard__name">{workout ? workout.name : 'Rest day'}</p>
      {workout && <p className="daycard__meta">{workout.duration} min</p>}
      <span className={`status status--${status.toLowerCase()}`}>{status}</span>
    </button>
  );
}
