// Placeholder data keyed by day of week (0 = Sunday). Replace with API data later.
const w = (name, conditioning, description, intensity, warmup, main) => ({
  name,
  conditioning,
  description,
  intensity,
  warmup,
  main,
});

export const WORKOUTS = {
  0: null,
  1: w('Chest Day', 'Hypertrophy', 'Heavy pressing volume to build chest, shoulders and triceps.', 7,
    [['Arm circles', '2 × 15'], ['Band pull-aparts', '2 × 15'], ['Push-ups', '2 × 10']],
    [['Bench press', '4 × 8'], ['Incline DB press', '3 × 10'], ['Cable fly', '3 × 12'], ['Triceps pushdown', '3 × 12']]),
  2: w('Back Day', 'Strength', 'Heavy pulling work for a stronger, thicker back.', 8,
    [['Cat-cow', '2 × 10'], ['Band rows', '2 × 15'], ['Hip hinge', '2 × 10']],
    [['Deadlift', '4 × 5'], ['Pull-ups', '4 × 6'], ['Barbell row', '3 × 8'], ['Face pull', '3 × 15']]),
  3: w('Leg Day', 'Hypertrophy', 'Builds quad and glute size with high-volume lower body work.', 8,
    [['Leg swings', '2 × 10 each side'], ['Hip openers', '90 sec'], ['Bodyweight squats', '2 × 12']],
    [['Back squat', '4 × 8'], ['Romanian deadlift', '3 × 10'], ['Leg press', '3 × 12'], ['Calf raise', '4 × 15']]),
  4: w('Shoulder Day', 'Endurance', 'Higher-rep shoulder work for stability and capacity.', 6,
    [['Arm circles', '2 × 15'], ['Band dislocates', '2 × 10'], ['Scap push-ups', '2 × 10']],
    [['Overhead press', '4 × 8'], ['Lateral raise', '4 × 15'], ['Rear delt fly', '3 × 15']]),
  5: w('Lower Body Power', 'Power', 'Builds sprint and jump power for soccer, using only the machines at your gym.', 7,
    [['Leg swings', '2 × 10 each side'], ['Hip openers', '90 sec'], ['Bodyweight squats', '2 × 12'], ['A-skips', '2 × 20 m']],
    [['Back squat', '4 × 6'], ['Leg press', '3 × 10'], ['Bulgarian split squat', '3 × 8'], ['Box jumps', '4 × 5'], ['Hamstring curl', '3 × 10'], ['Calf raise', '3 × 15']]),
  6: w('Full Body', 'Power', 'Explosive full body session to finish the week.', 7,
    [['Jumping jacks', '2 × 20'], ['World’s greatest stretch', '2 × 6'], ['Goblet squat', '2 × 10']],
    [['Power clean', '5 × 3'], ['Front squat', '4 × 5'], ['Push press', '4 × 5']]),
};

export const getWorkoutForDate = (date) => WORKOUTS[date.getDay()];
