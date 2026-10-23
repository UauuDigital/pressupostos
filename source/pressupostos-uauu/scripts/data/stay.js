import { eur } from '../lib/formatters.js';

// Servei STAY (The Wedding Stay) — només per a Ca n'Alzina
export const STAY_VENUE_ID = 'ca-nalzina';

// TODO: migrar al Google Sheet (SPREADSHEET_COLUMNS) quan es vulgui gestionar des del full
// ATENCIÓ: en migrar al Sheet cal TREURE d'aquí aquests ids (stay, stay-sopar, stay-barra, stay-brunch)
// per no cobrar dues vegades, ja que buildServiceId d'utils.js generaria els mateixos ids des del full.
export const STAY_CONFIG = {
  basePrice: 6500,
  includedPeople: 21,
  dinnerExtraPrice: 55,
  brunchExtraPrice: 45,
  barHourPricePerPerson: 6.5
};

// Entrada de STAY al desplegable "Afegir o treure servei opcional" (no ve del Google Sheet)
export const STAY_OPTION = { id: 'stay', label: 'STAY · The Wedding Stay' };

export const EMPTY_STAY = { active: false, dinnerPeople: 0, barHours: 0, brunchPeople: 0 };

export const STAY_TEXT = {
  ca: {
    stay: 'The Wedding Stay (2 nits)',
    stayDetail: (base) => `Estada de 2 nits per a ${STAY_CONFIG.includedPeople} persones · ${eur(base)}`,
    dinner: 'STAY · Sopar',
    dinnerDetail: (n, price) => `${n} persones addicionals × ${eur(price)}`,
    bar: 'STAY · Barra lliure',
    barDetail: (h, p, price) => `${h} h × ${p} pers. × ${eur(price)}`,
    brunch: 'STAY · Brunch',
    brunchDetail: (n, price) => `${n} persones addicionals × ${eur(price)}`,
    availability: 'Gener, febrer i març: qualsevol dia. Resta de l\'any: de dilluns a divendres.'
  },
  es: {
    stay: 'The Wedding Stay (2 noches)',
    stayDetail: (base) => `Estancia de 2 noches para ${STAY_CONFIG.includedPeople} personas · ${eur(base)}`,
    dinner: 'STAY · Cena',
    dinnerDetail: (n, price) => `${n} personas adicionales × ${eur(price)}`,
    bar: 'STAY · Barra libre',
    barDetail: (h, p, price) => `${h} h × ${p} pers. × ${eur(price)}`,
    brunch: 'STAY · Brunch',
    brunchDetail: (n, price) => `${n} personas adicionales × ${eur(price)}`,
    availability: 'Enero, febrero y marzo: cualquier día. Resto del año: de lunes a viernes.'
  },
  en: {
    stay: 'The Wedding Stay (2 nights)',
    stayDetail: (base) => `2-night stay for ${STAY_CONFIG.includedPeople} guests · ${eur(base)}`,
    dinner: 'STAY · Dinner',
    dinnerDetail: (n, price) => `${n} additional guests × ${eur(price)}`,
    bar: 'STAY · Open bar',
    barDetail: (h, p, price) => `${h} h × ${p} guests × ${eur(price)}`,
    brunch: 'STAY · Brunch',
    brunchDetail: (n, price) => `${n} additional guests × ${eur(price)}`,
    availability: 'January, February and March: any day. Rest of the year: Monday to Friday.'
  }
};

// Normalitza una entrada a enter >= 0 ('2,5' → 2, negatius/NaN → 0)
function toCount(v) {
  return Math.max(0, Math.floor(Number(String(v ?? '').replace(',', '.')) || 0));
}

function makeLine(id, label, priceDetail, computedPrice) {
  return { id, label, priceDetail, computedPrice, isMandatory: false, included: true };
}

export function getStayLines({ stay, lang = 'ca' }) {
  if (!stay?.active) return [];
  const t = STAY_TEXT[lang] || STAY_TEXT.ca;
  const { basePrice, includedPeople, dinnerExtraPrice, brunchExtraPrice, barHourPricePerPerson } = STAY_CONFIG;

  const dinnerPeople = toCount(stay.dinnerPeople);
  const barHours = toCount(stay.barHours);
  const brunchPeople = toCount(stay.brunchPeople);

  const lines = [makeLine('stay', t.stay, t.stayDetail(basePrice), basePrice)];

  const dinnerExtra = Math.max(0, dinnerPeople - includedPeople);
  const dinnerAmount = dinnerExtra * dinnerExtraPrice;
  if (dinnerAmount > 0) {
    lines.push(makeLine('stay-sopar', t.dinner, t.dinnerDetail(dinnerExtra, dinnerExtraPrice), dinnerAmount));
  }

  // La barra lliure es cobra per a totes les persones del sopar
  const barAmount = barHours * dinnerPeople * barHourPricePerPerson;
  if (barAmount > 0) {
    lines.push(makeLine('stay-barra', t.bar, t.barDetail(barHours, dinnerPeople, barHourPricePerPerson), barAmount));
  }

  const brunchExtra = Math.max(0, brunchPeople - includedPeople);
  const brunchAmount = brunchExtra * brunchExtraPrice;
  if (brunchAmount > 0) {
    lines.push(makeLine('stay-brunch', t.brunch, t.brunchDetail(brunchExtra, brunchExtraPrice), brunchAmount));
  }

  return lines;
}

// Gener, febrer i març: qualsevol dia; resta de l'any: dilluns a divendres
export function isStayDateAllowed(date) {
  if (!date) return null;
  const d = new Date(date + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return null;
  if (d.getMonth() <= 2) return true;
  const day = d.getDay();
  return day >= 1 && day <= 5;
}
