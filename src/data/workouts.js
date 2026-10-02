// Placeholder data keyed by day of week (0 = Sunday). Replace with API data later.
export const WORKOUTS = {
  0: null,
  1: {
    name: 'Chest Day',
    conditioning: 'Hypertrophy',
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
      { name: 'Cable Fly', sets: 3, reps: '12-15' },
      { name: 'Triceps Pushdown', sets: 3, reps: '12-15' },
    ],
  },
  2: {
    name: 'Back Day',
    conditioning: 'Strength',
    exercises: [
      { name: 'Deadlift', sets: 4, reps: '5' },
      { name: 'Pull-Up', sets: 4, reps: '6-8' },
      { name: 'Barbell Row', sets: 3, reps: '8' },
      { name: 'Face Pull', sets: 3, reps: '15' },
    ],
  },
  3: {
    name: 'Leg Day',
    conditioning: 'Hypertrophy',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: '8-10' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10' },
      { name: 'Leg Press', sets: 3, reps: '12' },
      { name: 'Calf Raise', sets: 4, reps: '15' },
    ],
  },
  4: {
    name: 'Shoulder Day',
    conditioning: 'Endurance',
    exercises: [
      { name: 'Overhead Press', sets: 4, reps: '8' },
      { name: 'Lateral Raise', sets: 4, reps: '15' },
      { name: 'Rear Delt Fly', sets: 3, reps: '15' },
    ],
  },
  5: {
    name: 'Arm Day',
    conditioning: 'Hypertrophy',
    exercises: [
      { name: 'Barbell Curl', sets: 4, reps: '10' },
      { name: 'Skull Crusher', sets: 4, reps: '10' },
      { name: 'Hammer Curl', sets: 3, reps: '12' },
    ],
  },
  6: {
    name: 'Full Body',
    conditioning: 'Power',
    exercises: [
      { name: 'Power Clean', sets: 5, reps: '3' },
      { name: 'Front Squat', sets: 4, reps: '5' },
      { name: 'Push Press', sets: 4, reps: '5' },
    ],
  },
};

export const getWorkoutForDate = (date) => WORKOUTS[date.getDay()];
