import { DAY_NAMES, ymd } from '../utils/dates.js';

const ex = (name, equipment, extra = {}) => ({ name, equipment, ...extra });

// Exercise library by muscle group. Equipment is matched against the user's available machines.
const LIBRARY = {
  Legs: [ex('Back squat', 'Squat rack'), ex('Leg press', 'Leg press'), ex('Bulgarian split squat', 'Dumbbells'), ex('Romanian deadlift', 'Barbell & plates'), ex('Leg extension', 'Leg extension'), ex('Lying leg curl', 'Lying leg curl'), ex('Box jumps', 'Plyo box')],
  Glutes: [ex('Hip thrust', 'Barbell & plates'), ex('Cable kickback', 'Cable machine'), ex('Step-ups', 'Dumbbells'), ex('Glute bridge', 'Bodyweight')],
  Core: [ex('Plank', 'Bodyweight'), ex('Cable crunch', 'Cable machine'), ex('Hanging knee raise', 'Bodyweight'), ex('Dead bug', 'Bodyweight')],
  Back: [ex('Lat pulldown', 'Lat pulldown'), ex('Barbell row', 'Barbell & plates'), ex('Seated cable row', 'Cable machine'), ex('Pull-ups', 'Bodyweight')],
  Chest: [ex('Bench press', 'Barbell & plates'), ex('Incline DB press', 'Dumbbells'), ex('Cable fly', 'Cable machine'), ex('Push-ups', 'Bodyweight')],
  Shoulders: [ex('Overhead press', 'Barbell & plates'), ex('Lateral raise', 'Dumbbells'), ex('Face pull', 'Cable machine'), ex('Rear delt fly', 'Dumbbells')],
  Arms: [ex('Barbell curl', 'Barbell & plates'), ex('Triceps pushdown', 'Cable machine'), ex('Hammer curl', 'Dumbbells'), ex('Skull crusher', 'Barbell & plates')],
  Calves: [ex('Calf raise', 'Smith machine'), ex('Seated calf raise', 'Leg press'), ex('Single-leg calf raise', 'Bodyweight')],
};

const CONDITIONING = {
  Strength: { label: 'Strength', sets: '4 × 5', rest: '2 min' },
  Hypertrophy: { label: 'Hypertrophy', sets: '3 × 10', rest: '90 s' },
  Endurance: { label: 'Endurance', sets: '3 × 15', rest: '45 s' },
  Mobility: { label: 'Mobility', sets: '3 × 8', rest: '60 s' },
  'Fat loss': { label: 'Conditioning', sets: '3 × 12', rest: '45 s' },
};

const WARMUP = [
  { name: 'Light cardio', equipment: 'Open floor', sets: '5 min', weight: '—', last: '—', rest: '—' },
  { name: 'Dynamic stretches', equipment: 'Bodyweight', sets: '2 × 10', weight: '—', last: '—', rest: '60 s' },
];

const COUNT_BY_LENGTH = { 30: 3, 45: 4, 60: 5, 90: 6 };
const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const usable = (item, machines, avoid) => {
  const name = item.name.toLowerCase();
  if (avoid.some((a) => a && name.includes(a.toLowerCase()))) return false;
  const bodyOrFloor = item.equipment === 'Bodyweight' || item.equipment === 'Open floor';
  return bodyOrFloor || machines.includes(item.equipment);
};

// Builds a plan for each date of `week`: a workout on selected training days, null (rest) otherwise.
export function generatePlan(week, filters) {
  const { days, length, intensity, muscles, machines, avoid, secondary, primary } = filters;
  const cond = CONDITIONING[secondary] ?? CONDITIONING.Strength;
  const focuses = muscles.length ? muscles : ['Legs', 'Back', 'Chest'];
  const count = COUNT_BY_LENGTH[length] ?? 4;
  const trainingDates = week
    .filter((d) => days.includes(DAY_NAMES[d.getDay()]))
    .sort((a, b) => WEEKDAY_ORDER.indexOf(DAY_NAMES[a.getDay()]) - WEEKDAY_ORDER.indexOf(DAY_NAMES[b.getDay()]));

  const plan = {};
  week.forEach((d) => { plan[ymd(d)] = null; });

  trainingDates.forEach((date, i) => {
    const focus = focuses[i % focuses.length];
    const pool = [
      ...LIBRARY[focus],
      ...focuses.filter((f) => f !== focus).flatMap((f) => LIBRARY[f]),
      ...Object.values(LIBRARY).flat(),
    ].filter((item, idx, arr) => usable(item, machines, avoid) && arr.findIndex((x) => x.name === item.name) === idx);

    const main = pool.slice(0, count).map((item) => ({
      name: item.name,
      equipment: item.equipment,
      sets: item.equipment === 'Bodyweight' && item.name === 'Plank' ? '3 × 45 s' : cond.sets,
      weight: '—',
      last: '—',
      rest: cond.rest,
    }));
    const sport = primary !== 'None' ? ` for ${primary.toLowerCase()}` : '';
    plan[ymd(date)] = {
      name: `${focus} Day`,
      conditioning: cond.label,
      description: `${cond.label} session focused on ${focus.toLowerCase()}${sport}, using the equipment you have.`,
      intensity,
      duration: length,
      warmup: WARMUP,
      main,
    };
  });
  return plan;
}
