import { useEffect, useState } from 'react';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// useState that survives reloads. Reads/writes are guarded since storage can be unavailable.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      return isPlainObject(initial) && isPlainObject(parsed) ? { ...initial, ...parsed } : parsed;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}

export const clearPersisted = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('alceo:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

export const downloadFile = (filename, text, type = 'text/csv') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const toCsv = (rows) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
