// Maps the Filters page state to backend `user_filters` rows and back, and syncs the difference.
import { del, patch, post } from './client.js';
import { DAYS, FOCUSES, MUSCLES } from '../data/filters.js';

const DAY_PREFIX = 'Training day: ';
const MUSCLE_PREFIX = 'Muscle priority: ';
const LENGTH = 'Session length';
const INTENSITY = 'Target intensity (RPE)';
const WEIGHT_TARGET = 'Target body weight';

export const EMPTY_FILTERS = {
  sport: 'None',
  focus: null,
  days: [],
  length: null,
  intensity: null,
  muscles: [],
  equipment: [],
  injuries: [],
  weightTarget: null,
  extras: [],
};

const lower = (s) => s.toLowerCase();
const addUnique = (list, item) => (list.some((x) => lower(x) === lower(item)) ? list : [...list, item]);

export function rowsToFilters(rows) {
  const f = { ...EMPTY_FILTERS, days: [], muscles: [], equipment: [], injuries: [], extras: [] };
  for (const r of rows) {
    if (!r.is_active) continue;
    const d = r.description;
    if (r.filter_type === 'sport' && f.sport === 'None') f.sport = d;
    else if (r.filter_type === 'training_component' && FOCUSES.includes(d) && !f.focus) f.focus = d;
    else if (r.filter_type === 'training_component' && d === INTENSITY && r.value_num != null) f.intensity = r.value_num;
    else if (r.filter_type === 'training_component' && d.startsWith(MUSCLE_PREFIX) && MUSCLES.includes(d.slice(MUSCLE_PREFIX.length))) {
      f.muscles = addUnique(f.muscles, d.slice(MUSCLE_PREFIX.length));
    } else if (r.filter_type === 'schedule' && d.startsWith(DAY_PREFIX) && DAYS.includes(d.slice(DAY_PREFIX.length))) {
      f.days = addUnique(f.days, d.slice(DAY_PREFIX.length));
    } else if (r.filter_type === 'schedule' && d === LENGTH && r.value_num != null) f.length = r.value_num;
    else if (r.filter_type === 'equipment') f.equipment = addUnique(f.equipment, d);
    else if (r.filter_type === 'injury') f.injuries = addUnique(f.injuries, d);
    else if (r.filter_type === 'weight_goal' && d === WEIGHT_TARGET && r.value_num != null) f.weightTarget = r.value_num;
    else if (!f.extras.some((x) => x.filter_type === r.filter_type && lower(x.description) === lower(d))) {
      f.extras.push({ filter_type: r.filter_type, description: d, value_num: r.value_num, unit: r.unit });
    }
  }
  f.days.sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
  return f;
}

const row = (filter_type, description, extra = {}) => ({
  filter_type, description, priority: null, value_num: null, unit: null, ...extra,
});

export function filtersToRows(f) {
  const rows = [];
  if (f.sport && f.sport !== 'None') rows.push(row('sport', f.sport, { priority: 1 }));
  if (f.focus) rows.push(row('training_component', f.focus, { priority: 1 }));
  if (f.intensity != null) rows.push(row('training_component', INTENSITY, { value_num: f.intensity, unit: 'rpe' }));
  f.muscles.forEach((m) => rows.push(row('training_component', MUSCLE_PREFIX + m)));
  f.days.forEach((d) => rows.push(row('schedule', DAY_PREFIX + d)));
  if (f.length != null) rows.push(row('schedule', LENGTH, { value_num: f.length, unit: 'min' }));
  f.equipment.forEach((e) => rows.push(row('equipment', e)));
  f.injuries.forEach((i) => rows.push(row('injury', i)));
  if (f.weightTarget != null) rows.push(row('weight_goal', WEIGHT_TARGET, { value_num: f.weightTarget, unit: 'kg' }));
  f.extras.forEach((x) => rows.push(row(x.filter_type, x.description, { value_num: x.value_num ?? null, unit: x.unit ?? null })));
  return rows;
}

const keyOf = (r) => `${r.filter_type}|${lower(r.description)}`;
const sameNum = (a, b) => (a == null ? null : Number(a)) === (b == null ? null : Number(b));
const differs = (cur, want) =>
  !sameNum(cur.value_num, want.value_num) || (cur.unit ?? null) !== (want.unit ?? null) || (cur.priority ?? null) !== (want.priority ?? null);

// `allRows` must include inactive rows so soft-deleted ones are reactivated instead of duplicated.
export async function syncFilters(allRows, desired) {
  const active = allRows.filter((r) => r.is_active);
  const wanted = new Map(desired.map((r) => [keyOf(r), r]));
  const kept = new Set();
  const ops = [];

  for (const r of active) {
    const key = keyOf(r);
    const want = wanted.get(key);
    if (!want || kept.has(key)) {
      ops.push(() => del(`/filters/${r.id}`));
      continue;
    }
    kept.add(key);
    if (differs(r, want)) {
      ops.push(() => patch(`/filters/${r.id}`, { value_num: want.value_num, unit: want.unit, priority: want.priority }));
    }
  }

  for (const [key, want] of wanted) {
    if (kept.has(key)) continue;
    const inactive = allRows.find((r) => !r.is_active && keyOf(r) === key);
    if (inactive) {
      ops.push(() => patch(`/filters/${inactive.id}`, {
        is_active: true, value_num: want.value_num, unit: want.unit, priority: want.priority,
      }));
    } else {
      ops.push(() => post('/filters', want));
    }
  }

  await Promise.all(ops.map((op) => op()));
}
