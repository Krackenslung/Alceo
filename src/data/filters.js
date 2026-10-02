export const PRIMARY = ['Soccer', 'Basketball', 'Running', 'Swimming', 'Cycling', 'None'];
export const SECONDARY = ['Strength', 'Hypertrophy', 'Endurance', 'Mobility', 'Fat loss'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const LENGTHS = [30, 45, 60, 90];
export const MUSCLES = ['Legs', 'Glutes', 'Core', 'Back', 'Chest', 'Shoulders', 'Arms', 'Calves'];
export const MACHINES = [
  'Squat rack', 'Leg press', 'Smith machine', 'Dumbbells', 'Barbell & plates', 'Lying leg curl',
  'Leg extension', 'Lat pulldown', 'Cable machine', 'Kettlebells', 'Treadmill', 'Plyo box',
];

export const INTENSITY_LABELS = ['', 'Easy', 'Easy', 'Light', 'Light', 'Moderate', 'Moderate', 'Hard', 'Hard', 'Very hard', 'Max'];

export const DEFAULT_FILTERS = {
  primary: 'Soccer',
  secondary: 'Strength',
  days: ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'],
  length: 45,
  intensity: 7,
  muscles: ['Legs', 'Glutes', 'Core'],
  machines: MACHINES.filter((m) => m !== 'Cable machine' && m !== 'Kettlebells'),
  avoid: ['Conventional deadlift', 'Overhead press'],
  allMachines: MACHINES,
};
