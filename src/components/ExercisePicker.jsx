import { useMemo, useState } from 'react';
import { post } from '../api/client.js';
import { useApp } from '../AppContext.jsx';
import { EQUIPMENT, EQUIPMENT_LABEL } from '../data/filters.js';
import { displayToKg } from '../lib/units.js';

const CATEGORIES = ['strength', 'cardio', 'mobility'];

// Adds an exercise from the backend catalog (or a new custom one) with starter sets.
export default function ExercisePicker({ onAdd, onCancel }) {
  const { catalog, units, toast } = useApp();
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [sets, setSets] = useState({ count: '3', reps: '10', weight: '' });
  const [custom, setCustom] = useState(null);
  const [extraCatalog, setExtraCatalog] = useState([]);

  const all = useMemo(() => [...catalog, ...extraCatalog], [catalog, extraCatalog]);
  const matches = all.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()));
  const chosen = all.find((e) => String(e.id) === exerciseId);

  const createCustom = async (e) => {
    e.preventDefault();
    try {
      const created = await post('/exercises', {
        name: custom.name.trim(),
        category: custom.category,
        equipment: custom.equipment || null,
      });
      setExtraCatalog((c) => [...c, created]);
      setExerciseId(String(created.id));
      setCustom(null);
      toast(`Created ${created.name}`);
    } catch (err) {
      toast(err.message);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!chosen) return;
    const count = Math.min(20, Math.max(0, Math.round(Number(sets.count) || 0)));
    const cardio = chosen.category === 'cardio';
    const one = cardio
      ? {}
      : { reps: sets.reps === '' ? null : Math.round(Number(sets.reps)), weight_kg: displayToKg(sets.weight, units) };
    onAdd({ exercise_id: chosen.id, sets: Array.from({ length: count }, () => ({ ...one })) });
  };

  if (custom) {
    return (
      <form className="picker" onSubmit={createCustom}>
        <input autoFocus required maxLength={150} placeholder="New exercise name" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
        <select value={custom.category} onChange={(e) => setCustom({ ...custom, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={custom.equipment} onChange={(e) => setCustom({ ...custom, equipment: e.target.value })}>
          <option value="">No equipment</option>
          {EQUIPMENT.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <button className="btn btn--lime" type="submit">Create</button>
        <button className="select" type="button" onClick={() => setCustom(null)}>Back</button>
      </form>
    );
  }

  return (
    <form className="picker" onSubmit={submit}>
      <input autoFocus placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
      <select required value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="" disabled>{matches.length ? `Choose (${matches.length})` : 'No match'}</option>
        {CATEGORIES.map((c) => {
          const items = matches.filter((e) => e.category === c);
          return items.length ? (
            <optgroup key={c} label={c}>
              {items.map((e) => (
                <option key={e.id} value={e.id}>{e.name}{e.equipment ? ` · ${EQUIPMENT_LABEL[e.equipment] ?? e.equipment}` : ''}</option>
              ))}
            </optgroup>
          ) : null;
        })}
      </select>
      <input type="number" min="0" max="20" aria-label="Sets" title="Sets" value={sets.count} onChange={(e) => setSets({ ...sets, count: e.target.value })} />
      {chosen?.category !== 'cardio' && (
        <>
          <input type="number" min="0" aria-label="Reps" title="Reps" placeholder="reps" value={sets.reps} onChange={(e) => setSets({ ...sets, reps: e.target.value })} />
          <input type="number" min="0" step="0.5" aria-label={`Weight (${units})`} placeholder={units} value={sets.weight} onChange={(e) => setSets({ ...sets, weight: e.target.value })} />
        </>
      )}
      <button className="btn btn--lime" type="submit" disabled={!chosen}>Add</button>
      <button className="link" type="button" onClick={() => setCustom({ name: query, category: 'strength', equipment: '' })}>+ Custom</button>
      <button className="select" type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}
