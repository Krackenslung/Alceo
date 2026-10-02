// Placeholder data keyed by day of week (0 = Sunday). Replace with API data later.
const ex = (name, equipment, sets, weight = '—', last = '—', rest = '90 s') => ({
  name,
  equipment,
  sets,
  weight,
  last,
  rest,
});

const w = (name, conditioning, description, intensity, duration, warmup, main) => ({
  name,
  conditioning,
  description,
  intensity,
  duration,
  warmup,
  main,
});

export const WORKOUTS = {
  0: null,
  1: w('Full Body Mobility', 'Mobility', 'Low-intensity mobility work to reset the body for the week.', 4, 25,
    [ex('Cat-cow', 'Bodyweight', '2 × 10', '—', '—', '60 s'), ex('World’s greatest stretch', 'Open floor', '2 × 6', '—', '—', '60 s')],
    [ex('Hip 90/90', 'Open floor', '3 × 8'), ex('Thoracic rotation', 'Bodyweight', '3 × 10'), ex('Deep squat hold', 'Bodyweight', '3 × 45 s')]),
  2: w('Lower Body Power', 'Power', 'Builds sprint and jump power for soccer, using only the machines at your gym.', 7, 53,
    [ex('Leg swings', 'Bodyweight', '2 × 10 each side', '—', '—', '90 s'), ex('Hip openers', 'Bodyweight', '80 sec', '—', '—', '90 s'), ex('Bodyweight squats', 'Bodyweight', '2 × 12', '—', '—', '90 s'), ex('A-skips', 'Open floor', '2 × 20 m', '—', '—', '90 s')],
    [ex('Back squat', 'Squat rack', '4 × 6', '80 kg', '80 kg · 4×6', '2 min'), ex('Leg press', 'Leg press machine', '3 × 10', '140 kg', '135 kg · 3×10'), ex('Bulgarian split squat', 'Dumbbells', '3 × 8 each', '16 kg', '16 kg · 3×8'), ex('Box jumps', 'Plyo box', '4 × 5', '—', '— · 4×5', '60 s'), ex('Hamstring curl', 'Lying leg curl', '3 × 12', '35 kg', '32.5 kg · 3×12'), ex('Calf raise', 'Smith machine', '3 × 15', '60 kg', '60 kg · 3×15', '45 s')]),
  3: w('Leg Day', 'Hypertrophy', 'Builds quad and glute size with high-volume lower body work.', 8, 55,
    [ex('Leg swings', 'Bodyweight', '2 × 10 each side'), ex('Hip openers', 'Bodyweight', '90 sec'), ex('Bodyweight squats', 'Bodyweight', '2 × 12')],
    [ex('Back squat', 'Squat rack', '4 × 8', '75 kg', '72.5 kg · 4×8', '2 min'), ex('Romanian deadlift', 'Barbell', '3 × 10', '70 kg', '67.5 kg · 3×10'), ex('Leg press', 'Leg press machine', '3 × 12', '140 kg', '135 kg · 3×12'), ex('Calf raise', 'Smith machine', '4 × 15', '60 kg', '60 kg · 4×15', '45 s')]),
  4: w('Upper Body Strength', 'Strength', 'Heavy upper body pressing and pulling for raw strength.', 8, 50,
    [ex('Arm circles', 'Bodyweight', '2 × 15'), ex('Band pull-aparts', 'Resistance band', '2 × 15')],
    [ex('Bench press', 'Barbell', '4 × 6', '70 kg', '67.5 kg · 4×6', '2 min'), ex('Pull-ups', 'Pull-up bar', '4 × 6', 'BW', 'BW · 4×6'), ex('Overhead press', 'Barbell', '3 × 8', '40 kg', '40 kg · 3×8'), ex('Barbell row', 'Barbell', '3 × 8', '60 kg', '57.5 kg · 3×8')]),
  5: w('Agility & Conditioning', 'Endurance', 'Short, sharp agility drills and conditioning intervals.', 7, 40,
    [ex('Jog', 'Open floor', '5 min'), ex('Dynamic stretches', 'Open floor', '2 × 8')],
    [ex('Ladder drills', 'Agility ladder', '5 × 30 s', '—', '—', '45 s'), ex('Shuttle runs', 'Open floor', '6 × 20 m', '—', '—', '60 s'), ex('Cone weaves', 'Cones', '5 × 20 s', '—', '—', '45 s')]),
  6: w('Soccer practice', 'Skill', 'Team practice — no gym work planned.', 6, 90,
    [ex('Team warm-up', 'Pitch', '15 min')],
    [ex('Small-sided games', 'Pitch', '4 × 10 min', '—', '—', '3 min')]),
};

export const getWorkoutForDate = (date) => WORKOUTS[date.getDay()];

// Placeholder history shown in the "Past … days" panel.
export const PAST_SESSIONS = [
  { id: 'a', date: 'Fri, Sep 25', short: 'Fri, Sep 25', info: '47 min · 9,860 kg', badge: 'Last time', delta: '+4%', volume: '9,860 kg', done: '6/6', effort: 8, note: 'knee felt good, push squat next time' },
  { id: 'b', date: 'Fri, Sep 18', short: 'Fri, Sep 18', info: '44 min · 9,480 kg', badge: '2 weeks ago', delta: '+6%', volume: '9,480 kg', done: '6/6', effort: 7, note: 'steady session' },
  { id: 'c', date: 'Sat, Sep 12', short: 'Sat, Sep 12', info: '50 min · 8,950 kg', badge: '3 weeks ago', delta: '−2%', volume: '8,950 kg', done: '5/6', effort: 8, note: 'skipped calf raises' },
  { id: 'd', date: 'Fri, Sep 5', short: 'Fri, Sep 5', info: '53 min · 8,120 kg', badge: '4 weeks ago', delta: '—', volume: '8,120 kg', done: '6/6', effort: 7, note: 'first week back' },
];
