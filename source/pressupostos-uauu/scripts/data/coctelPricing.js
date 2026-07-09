// ================================================================
//  Preus del format Còctel — dades fixes (no venen del Google Sheet)
//  Font: catàlegs "Noces Còctel 2027" i "Noces Còctel 2026".
//  dayOfWeek: 0=Diumenge, 1=Dl, 2=Dm, 3=Dc, 4=Dj, 5=Dv, 6=Ds
// ================================================================

// Can Macià i Mas Vivencs comparteixen exactament la mateixa taula (Taula C) en format Còctel.
export const COCTEL_VENUE_GROUP = {
  'ca-nalzina': 'ca-nalzina',
  'castell-de-tous': 'castell-de-tous',
  'can-macia': 'can-macia',
  'mas-vivencs': 'can-macia',
};

export const COCTEL_PENALTY_PER_PERSON = {
  'ca-nalzina': 75,
  'castell-de-tous': 100, // sense IVA especificat explícitament al document; s'aplica +IVA igual que les altres taules
  'can-macia': 75,
};

const ALTA_TEMPORADA_MONTHS = [6, 7, 9, 10]; // Juny, Juliol, Setembre, Octubre
const MAIG_AGOST_NOVEMBRE = [5, 8, 11];
const GENER_FEBRER_MARC_DESEMBRE = [1, 2, 3, 12];
const GENER_A_ABRIL_NOV_DES = [1, 2, 3, 4, 11, 12];
const TOTS_ELS_MESOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Entre setmana (dilluns-dijous) el catàleg no defineix preus propis: s'apliquen els mateixos que el diumenge.
function withWeekdaysAsSunday(dayRows) {
  return { ...dayRows, 1: dayRows[0], 2: dayRows[0], 3: dayRows[0], 4: dayRows[0] };
}

function buildBaseRows2027({ altaMin, mitjaMin, abrilMin, baixaMin, altaPreu, abrilPreu, baixaPreu }) {
  return {
    6: [ // Dissabte
      { months: ALTA_TEMPORADA_MONTHS, minGuests: altaMin, price: altaPreu },
      { months: MAIG_AGOST_NOVEMBRE, minGuests: mitjaMin, price: altaPreu },
      { months: [4], minGuests: abrilMin, price: abrilPreu },
      { months: GENER_FEBRER_MARC_DESEMBRE, minGuests: baixaMin, price: baixaPreu },
    ],
    5: [ // Divendres
      { months: ALTA_TEMPORADA_MONTHS, minGuests: abrilMin, price: abrilPreu },
      { months: [5, 8], minGuests: baixaMin, price: abrilPreu },
      { months: GENER_A_ABRIL_NOV_DES, minGuests: baixaMin, price: baixaPreu },
    ],
    0: [ // Diumenge (excepte vigílies de festiu, no comprovat automàticament)
      { months: TOTS_ELS_MESOS, minGuests: baixaMin, price: baixaPreu },
    ],
  };
}

function buildRows2027(params) {
  return withWeekdaysAsSunday(buildBaseRows2027(params));
}

// El catàleg 2026 no repeteix els mínims de convidats (només diferencia preu "dissabte
// temporada alta" vs "resta de dies"), però el mínim operatiu per banda de mesos és el
// mateix que el 2027 — es reutilitza l'estructura de mínims del 2027 i només es
// recalcula el preu segons la regla simplificada del catàleg 2026.
function buildRows2026FromBase2027(base2027, altaPreu2026, restaPreu2026) {
  const isAltaDissabte = (dow, row) =>
    dow === 6 && row.months.join(',') === ALTA_TEMPORADA_MONTHS.join(',');
  const remap = dow => base2027[dow].map(row => ({
    ...row,
    price: isAltaDissabte(dow, row) ? altaPreu2026 : restaPreu2026,
  }));
  return withWeekdaysAsSunday({ 6: remap(6), 5: remap(5), 0: remap(0) });
}

// Taula A — Ca n'Alzina
const CA_NALZINA_BASE_2027 = buildBaseRows2027({
  altaMin: 120, mitjaMin: 80, abrilMin: 60, baixaMin: 35,
  altaPreu: 148, abrilPreu: 138, baixaPreu: 132,
});
const CA_NALZINA_2027 = withWeekdaysAsSunday(CA_NALZINA_BASE_2027);
const CA_NALZINA_2026 = buildRows2026FromBase2027(CA_NALZINA_BASE_2027, 143, 130);

// Taula B — Castell de Tous
const CASTELL_DE_TOUS_BASE_2027 = buildBaseRows2027({
  altaMin: 80, mitjaMin: 60, abrilMin: 45, baixaMin: 35,
  altaPreu: 150, abrilPreu: 140, baixaPreu: 132,
});
const CASTELL_DE_TOUS_2027 = withWeekdaysAsSunday(CASTELL_DE_TOUS_BASE_2027);
const CASTELL_DE_TOUS_2026 = buildRows2026FromBase2027(CASTELL_DE_TOUS_BASE_2027, 145, 129);

// Taula C — Can Macià i Mas Vivencs
const CAN_MACIA_BASE_2027 = buildBaseRows2027({
  altaMin: 120, mitjaMin: 80, abrilMin: 60, baixaMin: 35,
  altaPreu: 144, abrilPreu: 134, baixaPreu: 128,
});
const CAN_MACIA_2027 = withWeekdaysAsSunday(CAN_MACIA_BASE_2027);
const CAN_MACIA_2026 = buildRows2026FromBase2027(CAN_MACIA_BASE_2027, 139, 126);

function withPenalty(dayRows, penaltyPerPerson) {
  const result = {};
  for (const dow of Object.keys(dayRows)) {
    result[dow] = dayRows[dow].map(row => ({ ...row, minimumPenaltyPerPerson: penaltyPerPerson }));
  }
  return result;
}

export const COCTEL_PRICE_MATRIX = {
  'ca-nalzina': {
    2027: withPenalty(CA_NALZINA_2027, COCTEL_PENALTY_PER_PERSON['ca-nalzina']),
    2026: withPenalty(CA_NALZINA_2026, COCTEL_PENALTY_PER_PERSON['ca-nalzina']),
  },
  'castell-de-tous': {
    2027: withPenalty(CASTELL_DE_TOUS_2027, COCTEL_PENALTY_PER_PERSON['castell-de-tous']),
    2026: withPenalty(CASTELL_DE_TOUS_2026, COCTEL_PENALTY_PER_PERSON['castell-de-tous']),
  },
  'can-macia': {
    2027: withPenalty(CAN_MACIA_2027, COCTEL_PENALTY_PER_PERSON['can-macia']),
    2026: withPenalty(CAN_MACIA_2026, COCTEL_PENALTY_PER_PERSON['can-macia']),
  },
};

// Suplements propis del format Còctel. `venueIds` restringeix l'extra a masies concretes; si s'omet, aplica a totes.
export const COCTEL_EXTRAS_BY_YEAR = {
  2027: [
    {
      id: 'coctel-menu-infantil',
      label: 'Menú infantil',
      labels: { ca: 'Menú infantil', es: 'Menú infantil', en: "Children's menu" },
      optional: true,
      quantityBased: true,
      unit: 'person',
      price: 68,
    },
    {
      id: 'coctel-aperitiu-jardi',
      label: "Aperitiu al jardí de la masia",
      labels: { ca: "Aperitiu al jardí de la masia", es: 'Aperitivo en el jardín de la masía', en: 'Garden aperitif' },
      optional: true,
      venueIds: ['ca-nalzina'],
      pricePerPerson: 10,
      minPrice: 1000,
    },
  ],
  2026: [
    {
      id: 'coctel-menu-infantil',
      label: 'Menú infantil',
      labels: { ca: 'Menú infantil', es: 'Menú infantil', en: "Children's menu" },
      optional: true,
      quantityBased: true,
      unit: 'person',
      price: 65,
    },
  ],
};
