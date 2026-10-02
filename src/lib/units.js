// The backend stores kg, cm, meters and seconds only. Conversion to lb/in happens here, for display.
export const KG_TO_LB = 2.20462;
export const CM_PER_IN = 2.54;

export const round = (n, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const isBlank = (v) => v === null || v === undefined || v === '' || Number.isNaN(Number(v));

export const kgToDisplay = (kg, units) => (kg == null ? null : round(units === 'lb' ? kg * KG_TO_LB : kg, 1));
export const displayToKg = (v, units) => (isBlank(v) ? null : round(units === 'lb' ? Number(v) / KG_TO_LB : Number(v), 2));
export const cmToDisplay = (cm, units) => (cm == null ? null : round(units === 'lb' ? cm / CM_PER_IN : cm, 1));
export const displayToCm = (v, units) => (isBlank(v) ? null : round(units === 'lb' ? Number(v) * CM_PER_IN : Number(v), 1));
export const heightUnit = (units) => (units === 'lb' ? 'in' : 'cm');

export const fmtWeight = (kg, units) => (kg == null ? '—' : `${kgToDisplay(kg, units).toLocaleString()} ${units}`);
export const fmtVolume = (kg, units) => `${Math.round(kgToDisplay(kg, units) ?? 0).toLocaleString()} ${units}`;
