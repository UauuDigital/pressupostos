import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRICE_CONFIG } from '../source/pressupostos-uauu/scripts/data/config.js';
import { computeQuote } from '../source/pressupostos-uauu/scripts/data/calculator.js';
import { EMPTY_STAY } from '../source/pressupostos-uauu/scripts/data/stay.js';

// 2026-11-18 és dimecres; la matriu real es carrega del Google Sheet, així que l'omplim aquí
const DATE = '2026-11-18';
const DOW = new Date(DATE + 'T12:00:00').getDay();
const matrix = { 2026: { [DOW]: [{ months: [11], price: 100, minGuests: 0 }] } };

PRICE_CONFIG.venues['ca-nalzina'].priceMatrix = matrix;
PRICE_CONFIG.venues['can-macia'].priceMatrix = matrix;

const quote = (venue, stay) => computeQuote({ venue, date: DATE, guests: 80, stay });
const stayLines = (q) => q.extrasLines.filter((l) => l.id.startsWith('stay'));

test('sense STAY actiu, extrasTotal és 0', () => {
  const q = quote('ca-nalzina', EMPTY_STAY);
  assert.equal(q.extrasTotal, 0);
  assert.equal(stayLines(q).length, 0);
});

test('STAY base suma 6500 a extrasTotal i hi ha 1 línia amb id stay', () => {
  const q = quote('ca-nalzina', { active: true, dinnerPeople: 21, barHours: 0, brunchPeople: 21 });
  assert.equal(q.extrasTotal, 6500);
  assert.equal(stayLines(q).length, 1);
  assert.equal(stayLines(q)[0].id, 'stay');
});

test('sopar 25 + barra 2 h + brunch 23 suma 7135 i l\'IVA es calcula sobre el subtotal', () => {
  const q = quote('ca-nalzina', { active: true, dinnerPeople: 25, barHours: 2, brunchPeople: 23 });
  assert.equal(q.extrasTotal, 6500 + 220 + 325 + 90);
  assert.equal(q.extrasTotal, 7135);
  assert.equal(q.vat, q.subtotal * PRICE_CONFIG.vatRate);
});

test('si la finca no és ca-nalzina, STAY s\'ignora', () => {
  const q = quote('can-macia', { active: true, dinnerPeople: 25, barHours: 2, brunchPeople: 23 });
  assert.equal(stayLines(q).length, 0);
  assert.equal(q.extrasTotal, 0);
});
