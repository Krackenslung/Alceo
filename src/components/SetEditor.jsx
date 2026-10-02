import { useState } from 'react';
import { displayToKg, kgToDisplay, round } from '../lib/units.js';

const str = (v) => (v == null ? '' : String(v));
const intOrNull = (v) => (v === '' ? null : Math.max(0, Math.round(Number(v))));
const numOrNull = (v, digits) => (v === '' ? null : round(Number(v), digits));

// One editable set row. Saves on blur when something changed; values are converted to kg before sending.
export default function SetEditor({ set, units, cardio, onSave, onDelete, compact = false }) {
  const initial = {
    reps: str(set.reps),
    weight: str(kgToDisplay(set.weight_kg, units)),
    duration: str(set.duration_seconds),
    distance: str(set.distance_m),
    rpe: str(set.rpe),
  };
  const [draft, setDraft] = useState(initial);

  const commit = (patchFields = {}) => {
    const changes = { ...patchFields };
    if (draft.reps !== initial.reps) changes.reps = intOrNull(draft.reps);
    if (draft.weight !== initial.weight) changes.weight_kg = displayToKg(draft.weight, units);
    if (draft.duration !== initial.duration) changes.duration_seconds = intOrNull(draft.duration);
    if (draft.distance !== initial.distance) changes.distance_m = numOrNull(draft.distance, 2);
    if (draft.rpe !== initial.rpe) changes.rpe = numOrNull(draft.rpe, 1);
    if (Object.keys(changes).length) onSave(changes);
  };

  const field = (key, label, props) => (
    <label className="setrow__field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        onBlur={() => commit()}
        {...props}
      />
    </label>
  );

  return (
    <div className={`setrow${set.completed_at ? ' setrow--done' : ''}${compact ? ' setrow--compact' : ''}`}>
      <span className="setrow__num">{set.is_warmup ? 'W' : set.set_number}</span>
      {cardio ? (
        <>
          {field('duration', 'sec', { min: 0, step: 1 })}
          {field('distance', 'm', { min: 0, step: 1 })}
        </>
      ) : (
        <>
          {field('reps', 'reps', { min: 0, step: 1 })}
          {field('weight', units, { min: 0, step: 0.5 })}
        </>
      )}
      {field('rpe', 'RPE', { min: 1, max: 10, step: 0.5 })}
      {!compact && (
        <label className="setrow__check">
          <input type="checkbox" checked={set.is_warmup} onChange={(e) => commit({ is_warmup: e.target.checked })} />
          warm-up
        </label>
      )}
      {onDelete && <button className="row-x" aria-label="Delete set" onClick={onDelete}>×</button>}
    </div>
  );
}
