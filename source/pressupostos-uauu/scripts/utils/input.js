import { getExtras } from '../data/calculator.js';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeQuantity(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.round(next));
}

export function getQuantityExtra(venueId, year, extraId) {
  if (!venueId || !year) return null;
  return getExtras(venueId, year).find(e => e.id === extraId) || null;
}
