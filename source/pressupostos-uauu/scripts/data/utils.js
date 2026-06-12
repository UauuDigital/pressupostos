// ================================================================
//  UTILITY FUNCTIONS
//  Text normalization, money parsing, type conversions
// ================================================================

function eur(n) {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function normText(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseBool(value, defaultValue = false) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const txt = normText(value);
  if (['1', 'true', 'yes', 'si', 's', 'y', 'sí', 'oui', 'x', 'checked', 'on', 'verdadero', 'v'].includes(txt)) return true;
  if (['0', 'false', 'no', 'n', 'falso', 'f'].includes(txt)) return false;
  return defaultValue;
}

function parseYearCell(value) {
  const year = Number(String(value ?? '').trim());
  return Number.isInteger(year) ? year : null;
}

function parseUnitStyle(value) {
  const txt = normText(value);
  if (txt.includes('person') || txt.includes('pers')) return 'person';
  if (txt.includes('pack')) return 'pack';
  if (txt.includes('unit')) return 'unit';
  return 'unit';
}

function buildServiceId(label, fallbackIndex) {
  const base = normText(label).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `service-${fallbackIndex}`;
}
