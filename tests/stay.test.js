import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_STAY,
  STAY_VENUE_ID,
  STAY_CONFIG,
  getStayLines,
  isStayDateAllowed
} from '../source/pressupostos-uauu/scripts/data/stay.js';

const byId = (lines, id) => lines.find((l) => l.id === id);

test('constants exportades', () => {
  assert.equal(STAY_VENUE_ID, 'ca-nalzina');
  assert.equal(STAY_CONFIG.basePrice, 6500);
  assert.deepEqual(EMPTY_STAY, { active: false, dinnerPeople: 0, barHours: 0, brunchPeople: 0 });
});

test('no retorna línies si STAY no és actiu', () => {
  assert.deepEqual(getStayLines({ stay: EMPTY_STAY }), []);
  assert.deepEqual(getStayLines({ stay: undefined }), []);
});

test('només STAY amb 21 persones al sopar i brunch', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 21, barHours: 0, brunchPeople: 21 } });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].id, 'stay');
  assert.equal(lines[0].computedPrice, 6500);
  assert.equal(lines[0].isMandatory, false);
  assert.equal(lines[0].included, true);
});

test('sopar 25 → +220', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 25, barHours: 0, brunchPeople: 21 } });
  const l = byId(lines, 'stay-sopar');
  assert.equal(l.computedPrice, 220);
  assert.ok(l.priceDetail.includes('4'));
  assert.ok(l.priceDetail.includes('55'));
});

test('brunch 23 → +90', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 21, barHours: 0, brunchPeople: 23 } });
  assert.equal(byId(lines, 'stay-brunch').computedPrice, 90);
});

test('barra 2 h amb sopar 25 → 325', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 25, barHours: 2, brunchPeople: 21 } });
  assert.equal(byId(lines, 'stay-barra').computedPrice, 325);
});

test('sopar 18 amb barra 2 h → sopar sense línia, barra 234', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 18, barHours: 2, brunchPeople: 21 } });
  assert.equal(byId(lines, 'stay-sopar'), undefined);
  assert.equal(byId(lines, 'stay-barra').computedPrice, 234);
});

test('barra sense persones al sopar → sense línia', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: 0, barHours: 3, brunchPeople: 0 } });
  assert.equal(byId(lines, 'stay-barra'), undefined);
});

test('entrades invàlides es normalitzen', () => {
  const lines = getStayLines({ stay: { active: true, dinnerPeople: '2,5', barHours: -3, brunchPeople: undefined } });
  for (const l of lines) {
    assert.ok(Number.isFinite(l.computedPrice) && l.computedPrice >= 0);
  }
  assert.equal(byId(lines, 'stay').computedPrice, 6500);
});

test('disponibilitat', () => {
  assert.equal(isStayDateAllowed(''), null);
  assert.equal(isStayDateAllowed('2026-11-18'), true);
  assert.equal(isStayDateAllowed('2026-10-24'), false);
  assert.equal(isStayDateAllowed('2027-02-20'), true);
  assert.equal(isStayDateAllowed('2026-10-25'), false);
});

test('les etiquetes existeixen en tres idiomes', () => {
  const stay = { active: true, dinnerPeople: 25, barHours: 2, brunchPeople: 23 };
  const labels = ['ca', 'es', 'en'].map((lang) => byId(getStayLines({ stay, lang }), 'stay').label);
  labels.forEach((x) => assert.ok(x && x.length > 0));
  assert.equal(new Set(labels).size, 3);
});
