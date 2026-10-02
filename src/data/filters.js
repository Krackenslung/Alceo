// UI vocabulary for the Filters page. Each choice is stored as a backend `user_filters` row (see api/filters.js).
export const SPORTS = ['Soccer', 'Basketball', 'Running', 'Swimming', 'Cycling', 'Tennis', 'None'];
export const FOCUSES = ['Strength', 'Hypertrophy', 'Endurance', 'Mobility', 'Fat loss'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const LENGTHS = [30, 45, 60, 90];
export const MUSCLES = ['Legs', 'Glutes', 'Core', 'Back', 'Chest', 'Shoulders', 'Arms', 'Calves'];

// Must match the backend's exercises.equipment / equipment-filter vocabulary exactly.
export const EQUIPMENT = [
  ['barbell', 'Barbell & plates'],
  ['dumbbell', 'Dumbbells'],
  ['kettlebell', 'Kettlebells'],
  ['machine', 'Machines'],
  ['cable', 'Cable machine'],
  ['band', 'Resistance bands'],
  ['bodyweight', 'Bodyweight'],
  ['other', 'Other'],
];
export const EQUIPMENT_LABEL = Object.fromEntries(EQUIPMENT);

// Backend filter types without a dedicated control; shown in "Other notes".
export const EXTRA_TYPES = [
  ['venue', 'Venue'],
  ['benchmark', 'Benchmark'],
  ['weight_goal', 'Weight goal'],
  ['training_component', 'Training'],
  ['schedule', 'Schedule'],
  ['sport', 'Sport'],
];
export const TYPE_LABEL = { ...Object.fromEntries(EXTRA_TYPES), injury: 'Injury', equipment: 'Equipment' };

export const INTENSITY_LABELS = ['', 'Easy', 'Easy', 'Light', 'Light', 'Moderate', 'Moderate', 'Hard', 'Hard', 'Very hard', 'Max'];
