// Placeholder progress data per range. Replace with API data later.
const bars = (values, prefix) => values.map((v, i) => ({ label: `${prefix}${i + 1}`, value: v }));

export const RANGES = [
  { id: '4w', label: '4 weeks', period: '4 weeks ago' },
  { id: '12w', label: '12 weeks', period: '12 weeks ago' },
  { id: '6m', label: '6 months', period: '6 months ago' },
  { id: '1y', label: '1 year', period: '1 year ago' },
];

export const PROGRESS = {
  '4w': {
    stats: [
      ['Sessions', '13', '+2 vs prev. 4 wks'],
      ['Total volume', '108,900 kg', '+9%'],
      ['Avg. session', '48 min', '+1 min'],
      ['New personal records', '3', '3 this month'],
    ],
    volume: bars([8200, 8900, 8600, 10400], 'W'),
    muscles: [['Legs', 34], ['Back', 20], ['Chest', 16], ['Shoulders', 12], ['Core', 10], ['Arms', 8]],
  },
  '12w': {
    stats: [
      ['Sessions', '38', '+6 vs prev. 12 wks'],
      ['Total volume', '312,400 kg', '+14%'],
      ['Avg. session', '46 min', '+3 min'],
      ['New personal records', '9', '3 this month'],
    ],
    volume: bars([6200, 6900, 5600, 7400, 7800, 6800, 8200, 8800, 8000, 9200, 9700, 11800], 'W'),
    muscles: [['Legs', 34], ['Back', 20], ['Chest', 16], ['Shoulders', 12], ['Core', 10], ['Arms', 8]],
  },
  '6m': {
    stats: [
      ['Sessions', '74', '+11 vs prev. 6 mos'],
      ['Total volume', '604,200 kg', '+19%'],
      ['Avg. session', '47 min', '+4 min'],
      ['New personal records', '17', '3 this month'],
    ],
    volume: bars([78000, 84000, 91000, 99000, 104000, 112000], 'M'),
    muscles: [['Legs', 32], ['Back', 21], ['Chest', 17], ['Shoulders', 12], ['Core', 11], ['Arms', 7]],
  },
  '1y': {
    stats: [
      ['Sessions', '141', '+23 vs prev. year'],
      ['Total volume', '1,180,000 kg', '+27%'],
      ['Avg. session', '45 min', '+5 min'],
      ['New personal records', '31', '3 this month'],
    ],
    volume: bars([60, 64, 66, 70, 72, 78, 84, 88, 94, 99, 104, 112].map((v) => v * 1000), 'M'),
    muscles: [['Legs', 31], ['Back', 21], ['Chest', 17], ['Shoulders', 13], ['Core', 11], ['Arms', 7]],
  },
};

export const RECORDS = [
  ['Back squat', 'Sep 25', '82.5 kg × 5'],
  ['Leg press', 'Sep 25', '140 kg × 10'],
  ['Bench press', 'Sep 24', '70 kg × 6'],
  ['Pull-ups', 'Sep 17', 'BW + 10 kg × 5'],
  ['5 km run', 'Sep 12', '24:10'],
  ['Barbell row', 'Sep 10', '60 kg × 8'],
  ['Overhead press', 'Sep 3', '42.5 kg × 5'],
  ['Romanian deadlift', 'Aug 29', '80 kg × 8'],
];

export const STRENGTH = [
  ['Back squat', '70 kg × 5', '82.5 kg × 5', '+18%'],
  ['Leg press', '115 kg × 10', '140 kg × 10', '+22%'],
  ['Bench press', '62.5 kg × 6', '70 kg × 6', '+12%'],
  ['Romanian deadlift', '70 kg × 8', '80 kg × 8', '+14%'],
  ['Hamstring curl', '35 kg × 12', '32.5 kg × 12', '−7%'],
];
