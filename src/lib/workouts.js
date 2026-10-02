// Pure helpers over backend workout objects ({ exercises: [{ sets: [...] }] }).
import { fmtWeight, kgToDisplay } from './units.js';
import { addDays, getWeek, ymd } from '../utils/dates.js';

export const toDate = (iso) => (iso ? new Date(iso) : null);
export const workoutName = (w) => w?.name || 'Untitled workout';

// Warm-ups are sets with is_warmup; an exercise whose sets are all warm-ups is shown in the warm-up block.
export const isWarmupExercise = (we) => we.sets.length > 0 && we.sets.every((s) => s.is_warmup);
export const splitExercises = (w) => ({
  warmup: w.exercises.filter(isWarmupExercise),
  main: w.exercises.filter((e) => !isWarmupExercise(e)),
});

export const countSets = (w) => w.exercises.reduce((n, e) => n + e.sets.length, 0);
export const countDone = (w) => w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed_at).length, 0);
export const warmupCount = (sets) => sets.filter((s) => s.is_warmup).length;

const fmtDuration = (sec) => (sec >= 60 && sec % 60 === 0 ? `${sec / 60} min` : `${sec} s`);
const fmtDistance = (m) => (m >= 1000 ? `${m / 1000} km` : `${m} m`);
const uniq = (arr) => [...new Set(arr)];
const span = (vals, fmt = (v) => v) =>
  vals.length === 1 ? fmt(vals[0]) : `${fmt(Math.min(...vals))}–${fmt(Math.max(...vals))}`;

export function setLabel(s, units) {
  const parts = [];
  if (s.reps != null) parts.push(s.weight_kg != null ? `${s.reps} × ${fmtWeight(s.weight_kg, units)}` : `${s.reps} reps`);
  else if (s.weight_kg != null) parts.push(fmtWeight(s.weight_kg, units));
  if (s.duration_seconds != null) parts.push(fmtDuration(s.duration_seconds));
  if (s.distance_m != null) parts.push(fmtDistance(s.distance_m));
  return parts.length ? parts.join(' · ') : '—';
}

// "3 × 10 · 20 kg" for the working sets (or all sets when they are all warm-ups).
export function summarizeSets(sets, units) {
  const working = sets.filter((s) => !s.is_warmup);
  const list = working.length ? working : sets;
  if (!list.length) return 'No sets';
  const n = list.length;
  const pick = (field) => uniq(list.map((s) => s[field]).filter((v) => v != null));
  const reps = pick('reps');
  const durations = pick('duration_seconds');
  const distances = pick('distance_m');
  let text;
  if (reps.length) text = `${n} × ${span(reps)}`;
  else if (durations.length) text = `${n} × ${span(durations, fmtDuration)}`;
  else if (distances.length) text = `${n} × ${span(distances, fmtDistance)}`;
  else text = `${n} set${n === 1 ? '' : 's'}`;
  const weights = pick('weight_kg').map((kg) => kgToDisplay(kg, units));
  if (weights.length) text += ` · ${span(weights)} ${units}`;
  return text;
}

const working = (w) => w.exercises.flatMap((e) => e.sets.filter((s) => !s.is_warmup));

// kg moved in completed working sets.
export const workoutVolume = (w) =>
  working(w).reduce((v, s) => v + (s.completed_at && s.reps && s.weight_kg ? s.reps * s.weight_kg : 0), 0);

export const durationMinutes = (w) => {
  const a = toDate(w.started_at);
  const b = toDate(w.finished_at);
  return a && b ? Math.max(1, Math.round((b - a) / 60000)) : null;
};

const mean = (vals) => (vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null);
export const avgRpe = (w) => mean(working(w).filter((s) => s.completed_at && s.rpe != null).map((s) => s.rpe));
export const plannedRpe = (w) => mean(working(w).filter((s) => s.rpe != null).map((s) => s.rpe));

const finishedDay = (w) => ymd(toDate(w.finished_at));

export function trainingStreak(history, today) {
  const days = new Set(history.map(finishedDay));
  let d = new Date(today);
  if (!days.has(ymd(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(ymd(d))) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export const weekStartOf = (date, weekStart) => {
  const d = getWeek(date, weekStart)[0];
  d.setHours(0, 0, 0, 0);
  return d;
};

// Completed-set volume for the last `count` weeks, oldest first.
export function weeklyVolume(history, today, weekStart, count) {
  const current = weekStartOf(today, weekStart);
  return Array.from({ length: count }, (_, i) => {
    const start = addDays(current, -7 * (count - 1 - i));
    const end = addDays(start, 7);
    const value = history
      .filter((w) => toDate(w.finished_at) >= start && toDate(w.finished_at) < end)
      .reduce((v, w) => v + workoutVolume(w), 0);
    return { label: `${start.getMonth() + 1}/${start.getDate()}`, value, start };
  });
}

// --- personal bests ---

export function bestSet(sets) {
  let best = null;
  for (const s of sets) {
    if (!s.completed_at || s.is_warmup || s.weight_kg == null) continue;
    if (!best || s.weight_kg > best.weight_kg || (s.weight_kg === best.weight_kg && (s.reps ?? 0) > (best.reps ?? 0))) best = s;
  }
  return best;
}

const beats = (a, b) => a.weight_kg > b.weight_kg || (a.weight_kg === b.weight_kg && (a.reps ?? 0) > (b.reps ?? 0));

// One entry per (workout, exercise) with a weighted completed set, oldest first.
export function exerciseTimeline(history) {
  const chrono = [...history].sort((a, b) => toDate(a.finished_at) - toDate(b.finished_at));
  const out = [];
  for (const w of chrono) {
    for (const e of w.exercises) {
      const best = bestSet(e.sets);
      if (best) out.push({ exerciseId: e.exercise_id, name: e.exercise_name, date: toDate(w.finished_at), best });
    }
  }
  return out;
}

// events: every time an exercise beat its previous best. current: today's best per exercise.
export function personalRecords(history) {
  const bests = new Map();
  const events = [];
  for (const t of exerciseTimeline(history)) {
    const prev = bests.get(t.exerciseId);
    if (!prev || beats(t.best, prev.best)) {
      if (prev) events.push(t);
      bests.set(t.exerciseId, t);
    }
  }
  return { events, current: [...bests.values()] };
}

// Most recent completed performance of an exercise, excluding one workout.
export function lastPerformance(history, exerciseId, excludeWorkoutId) {
  for (const w of history) {
    if (w.id === excludeWorkoutId) continue;
    const e = w.exercises.find((x) => x.exercise_id === exerciseId);
    if (e && e.sets.some((s) => s.completed_at)) return { workout: w, exercise: e, best: bestSet(e.sets) };
  }
  return null;
}
