import * as XLSX from 'xlsx';
import { VENUES, SPREADSHEET_COLUMNS, SPREADSHEET_URL } from './constants.js';
import { normText, parseMoney, parseBool, parseYearCell, parseUnitStyle, buildServiceId } from './utils.js';
import {
  pickColumn, pickColumnStrict, pickColumnExcluding, pickColumnExcludingStrict,
  pickColumnLoose, pickColumnLooseExcluding, pickColumnRegexExcluding,
  parseServiceNames, parseJsonOptions, parseNamePricePair,
  parseExtraUnitValue, parseExtraExtresValue, parseVenueIds, wantsDropdown,
} from './parsers.js';
import { PRICE_CONFIG } from './config.js';

function buildExtrasByVenue(rows) {
  const extrasByVenue = {};
  for (const venue of VENUES) extrasByVenue[venue.id] = {};
  const seen = new Set();

  rows.forEach((row, index) => {
    const labels = parseServiceNames(row);
    const venueCell = pickColumn(row, SPREADSHEET_COLUMNS.venue);
    const yearCell = pickColumn(row, SPREADSHEET_COLUMNS.year);
    const priceCell = pickColumn(row, SPREADSHEET_COLUMNS.price);
    const unitCell = pickColumn(row, SPREADSHEET_COLUMNS.unit);
    const quantityCell = pickColumn(row, SPREADSHEET_COLUMNS.quantity) ?? pickColumnLoose(row, ['quantity', 'based']);
    const optionalCell = pickColumn(row, SPREADSHEET_COLUMNS.optional);
    const extraTypeCell = pickColumnStrict(row, SPREADSHEET_COLUMNS.extraType);
    const dropdownCell = pickColumn(row, SPREADSHEET_COLUMNS.dropdown);
    const extrasListCell = pickColumnStrict(row, SPREADSHEET_COLUMNS.extrasList);
    const thresholdMainCell =
      pickColumnExcludingStrict(row, SPREADSHEET_COLUMNS.thresholdMain, ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'principi'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'princi'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llind', 'principi'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'inici'], ['extra']) ??
      pickColumnLooseExcluding(row, ['umbral', 'inicio'], ['extra']) ??
      pickColumnRegexExcluding(row, [/llind.*princip/i, /llind.*principal/i, /llind.*inici/i, /llind.*start/i, /llind.*min/i], ['extra']);
    const thresholdFinalCell =
      pickColumnExcludingStrict(row, SPREADSHEET_COLUMNS.thresholdFinal, ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'final'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'max'], ['extra']) ??
      pickColumnLooseExcluding(row, ['umbral', 'final'], ['extra']) ??
      pickColumnRegexExcluding(row, [/llinda.*final/i, /llinda.*max/i], ['extra']);
    const thresholdPriceBelowCell =
      pickColumnExcludingStrict(row, SPREADSHEET_COLUMNS.thresholdPriceBelow, ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'preu', 'x<0'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'preu', 'inferior'], ['extra']) ??
      pickColumnLooseExcluding(row, ['umbral', 'precio', 'inferior'], ['extra']) ??
      pickColumnRegexExcluding(row, [/llinda.*preu.*x\s*<?\s*0/i, /llinda.*preu.*inferior/i], ['extra']);
    const thresholdPriceAboveCell =
      pickColumnExcludingStrict(row, SPREADSHEET_COLUMNS.thresholdPriceAbove, ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'preu', 'x>0'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'preu', '0<x'], ['extra']) ??
      pickColumnLooseExcluding(row, ['llinda', 'preu', 'superior'], ['extra']) ??
      pickColumnLooseExcluding(row, ['umbral', 'precio', 'superior'], ['extra']) ??
      pickColumnRegexExcluding(row, [/llinda.*preu.*x\s*>?\s*0/i, /llinda.*preu.*0\s*<\s*x/i, /llinda.*preu.*superior/i, /llinda.*preu.*max/i], ['extra']);

    if (!labels || !venueCell || !yearCell) return;
    const venueIds = parseVenueIds(venueCell);
    const year = parseYearCell(yearCell);
    const price = parseMoney(priceCell);
    if (!venueIds.length || !year) return;

    const id = buildServiceId(labels.ca || labels.es || labels.en, index);
    const quantityBased = parseBool(quantityCell, false) || ['quantity', 'quantitat', 'quantitat?', 'q', 'qty', 'quantitybased', 'yes', 'true', 'verdadero', 'vrai', 'si', 'sí'].includes(normText(quantityCell));
    const optional = parseBool(optionalCell, true);
    const unit = parseUnitStyle(unitCell);
    const dropdownOptions = parseJsonOptions(dropdownCell);
    const extraListType = normText(extrasListCell);
    const extraExtresOptions = parseExtraExtresValue(row);
    const extraUnitPair = parseNamePricePair(parseExtraUnitValue(row));
    const thresholdMain = parseMoney(thresholdMainCell);
    const thresholdFinal = parseMoney(thresholdFinalCell);
    const thresholdPriceBelow = parseMoney(thresholdPriceBelowCell);
    const thresholdPriceAbove = parseMoney(thresholdPriceAboveCell);
    const signature = `${id}|${year}|${venueIds.slice().sort().join(',')}|${quantityBased ? 1 : 0}|${optional ? 1 : 0}|${unit}|${price ?? ''}|${extraListType ?? ''}|${dropdownOptions.map(o => `${o.label}:${o.price}`).join(',')}|${extraExtresOptions.map(o => `${o.label}:${o.price}`).join(',')}|${thresholdMain ?? ''}|${thresholdFinal ?? ''}|${thresholdPriceBelow ?? ''}|${thresholdPriceAbove ?? ''}`;
    if (seen.has(signature)) return;
    seen.add(signature);

    const extra = {
      id,
      label: String(labels.ca).trim(),
      labels,
      optional,
      extraListCell: extrasListCell,
      year,
    };

    if (price !== null) extra.price = price;
    const hasThresholdData =
      thresholdMain !== null ||
      thresholdFinal !== null ||
      thresholdPriceBelow !== null ||
      thresholdPriceAbove !== null;

    if (dropdownOptions.length) {
      extra.dropdownOptions = dropdownOptions;
    }
    if (extraExtresOptions.length) {
      extra.extraExtresOptions = extraExtresOptions;
    }
    if (extraUnitPair) {
      extra.extraUnitPair = extraUnitPair;
      extra.hasExtraUnit = true;
    }
    if (wantsDropdown(extrasListCell) || extraListType.includes('despleg')) {
      extra.extraType = 'desplegable';
    } else if (extraListType.includes('llinda')) {
      extra.extraType = 'llinda';
    } else if (extraListType.includes('altres')) {
      extra.extraType = 'altres-extres';
    } else if (hasThresholdData) {
      extra.extraType = 'llinda';
    }
    if (extra.extraType === 'llinda' || hasThresholdData) {
      if (thresholdMain !== null) extra.thresholdMain = thresholdMain;
      if (thresholdFinal !== null) extra.thresholdFinal = thresholdFinal;
      if (thresholdPriceBelow !== null) extra.thresholdPriceBelow = thresholdPriceBelow;
      if (thresholdPriceAbove !== null) extra.thresholdPriceAbove = thresholdPriceAbove;
    }
    if (quantityBased) {
      extra.quantityBased = true;
      extra.unit = unit;
    } else if (unitCell) {
      extra.unit = unit;
    }

    for (const venueId of venueIds) {
      if (!extrasByVenue[venueId][year]) extrasByVenue[venueId][year] = [];
      extrasByVenue[venueId][year].push(extra);
    }
  });

  return extrasByVenue;
}

function getDirectCellByNormalizedKey(row, targetKey) {
  const wanted = normText(targetKey);
  for (const key of Object.keys(row || {})) {
    if (normText(key) === wanted) return row[key];
  }
  return undefined;
}

function parsePricePair(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { full: null, half: null };
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { full: parseMoney(parts[0]), half: parseMoney(parts[1]) };
  }
  const single = parseMoney(raw);
  return { full: single, half: single };
}

function parseDays(dayCell) {
  const raw = String(dayCell ?? '').trim().toLowerCase();
  if (!raw) return [0, 1, 2, 3, 4, 5, 6];

  const normalizedRaw = normText(raw);
  if (
    raw === '*' ||
    normalizedRaw === 'tots' ||
    normalizedRaw.includes('tots els dies') ||
    normalizedRaw.includes('all days') ||
    normalizedRaw.includes('every day')
  ) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  const dayMap = {
    'diumenge': 0, 'domingo': 0, 'sunday': 0, 'dg': 0, 'dg.': 0, 'dgo': 0, '0': 0,
    'dilluns': 1, 'lunes': 1, 'monday': 1, 'dl': 1, 'dl.': 1, 'lun': 1, '1': 1,
    'dimarts': 2, 'martes': 2, 'tuesday': 2, 'dm': 2, 'dm.': 2, 'mar': 2, '2': 2,
    'dimecres': 3, 'miércoles': 3, 'miercoles': 3, 'wednesday': 3, 'dc': 3, 'dc.': 3, '3': 3,
    'dijous': 4, 'jueves': 4, 'thursday': 4, 'dj': 4, 'dj.': 4, 'jue': 4, '4': 4,
    'divendres': 5, 'viernes': 5, 'friday': 5, 'dv': 5, 'dv.': 5, 'vie': 5, '5': 5,
    'dissabte': 6, 'sábado': 6, 'sabado': 6, 'saturday': 6, 'ds': 6, 'ds.': 6, 'sab': 6, '6': 6,
  };

  const tokens = raw
    .replace(/\s+i\s+/gi, ',')
    .split(/[,;/|+\n-]/)
    .map(t => t.trim())
    .filter(Boolean);
  const days = [];

  for (const token of tokens) {
    const normalized = normText(token);

    if (token.includes('-') && !token.includes(',')) {
      const parts = token.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const start = dayMap[parts[0]] !== undefined ? dayMap[parts[0]] : parseInt(parts[0]);
        const end = dayMap[parts[1]] !== undefined ? dayMap[parts[1]] : parseInt(parts[1]);
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= 6 && end >= 0 && end <= 6) {
          const [min, max] = start <= end ? [start, end] : [end, start];
          for (let i = min; i <= max; i++) days.push(i);
          continue;
        }
      }
    }

    const directMatch = dayMap[normalized];
    if (directMatch !== undefined) {
      days.push(directMatch);
    } else {
      let matched = false;
      for (const [label, value] of Object.entries(dayMap)) {
        if (label.length > 1 && normalized.includes(label)) {
          days.push(value);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const num = parseInt(token);
        if (Number.isInteger(num) && num >= 0 && num <= 6) {
          days.push(num);
        }
      }
    }
  }

  return [...new Set(days)];
}

function parseMonths(monthCell) {
  const raw = String(monthCell ?? '').trim().toLowerCase();
  if (!raw) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const monthMap = {
    'gener': 1, 'january': 1, 'enero': 1, '1': 1,
    'febrer': 2, 'february': 2, 'febrero': 2, '2': 2,
    'març': 3, 'march': 3, 'marzo': 3, '3': 3,
    'abril': 4, 'april': 4, '4': 4,
    'maig': 5, 'may': 5, 'mayo': 5, '5': 5,
    'juny': 6, 'june': 6, 'junio': 6, '6': 6,
    'juliol': 7, 'july': 7, 'julio': 7, '7': 7,
    'agost': 8, 'august': 8, 'agosto': 8, '8': 8,
    'setembre': 9, 'september': 9, 'septiembre': 9, '9': 9,
    'octubre': 10, 'october': 10, '10': 10,
    'novembre': 11, 'november': 11, 'noviembre': 11, '11': 11,
    'desembre': 12, 'december': 12, 'diciembre': 12, '12': 12,
  };

  const tokens = raw.split(/[,;/|+\n-]/).map(t => t.trim()).filter(Boolean);
  const months = [];

  for (const token of tokens) {
    const normalized = normText(token);

    if (token.includes('-') && !token.includes(',')) {
      const parts = token.split('-').map(p => p.trim());
      if (parts.length === 2) {
        const startNorm = normText(parts[0]);
        const endNorm = normText(parts[1]);
        const start = monthMap[startNorm] !== undefined ? monthMap[startNorm] : parseInt(parts[0]);
        const end = monthMap[endNorm] !== undefined ? monthMap[endNorm] : parseInt(parts[1]);
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 1 && start <= 12 && end >= 1 && end <= 12) {
          const [min, max] = start <= end ? [start, end] : [end, start];
          for (let i = min; i <= max; i++) months.push(i);
          continue;
        }
      }
    }

    if (monthMap[normalized] !== undefined) {
      months.push(monthMap[normalized]);
    } else {
      const num = parseInt(token);
      if (Number.isInteger(num) && num >= 1 && num <= 12) {
        months.push(num);
      }
    }
  }

  return [...new Set(months)];
}

function parseExceptions(exceptionCell) {
  const raw = String(exceptionCell ?? '').trim().toLowerCase();
  if (!raw) return [];

  const exceptions = [];
  const tokens = raw.split(/[,;/|+\n]/).map(t => t.trim().toLowerCase()).filter(Boolean);

  for (const token of tokens) {
    const normalized = normText(token);
    if (normalized.includes('cap') && normalized.includes('any')) exceptions.push('new-year');
    if (normalized.includes('vigilia') || (normalized.includes('vigilies') && normalized.includes('festiu'))) exceptions.push('holiday-eve');
    if (normalized.includes('festiu') || normalized.includes('festivo') || normalized.includes('holiday')) exceptions.push('holiday');
  }

  return [...new Set(exceptions)];
}

function buildBarLliureByVenue(rows) {
  const byVenue = {};
  for (const venue of VENUES) byVenue[venue.id] = {};

  rows.forEach(row => {
    const venueCell = pickColumn(row, ['masies', 'masia', 'finca', 'venue']);
    const yearCell = pickColumn(row, ['any', 'ay', 'year']);
    const minCell = pickColumnStrict(row, ['min', 'mín', 'minimum']);
    const siMinCell = pickColumnStrict(row, ['simin€', 'simin', 'si min€', 'si min']);
    const noMinCell = pickColumnStrict(row, ['nomin€', 'nomin', 'no min€', 'no min']);
    const premiumCell = pickColumn(row, ['premium']);

    if (!venueCell || !yearCell) return;
    const venueIds = parseVenueIds(venueCell);
    const year = parseYearCell(yearCell);
    if (!venueIds.length || !year) return;

    const minAdults = Math.max(0, Number(minCell ?? 0));
    const siMin = parsePricePair(siMinCell);
    const noMin = parsePricePair(noMinCell);
    const premium = parseMoney(premiumCell);

    for (const venueId of venueIds) {
      if (!byVenue[venueId]) continue;
      if (!byVenue[venueId][year]) byVenue[venueId][year] = [];
      byVenue[venueId][year].push({
        id: 'barlliure',
        label: 'Barra lliure',
        labels: { ca: 'Barra lliure', es: 'Barra libre', en: 'Open bar' },
        optional: true,
        quantityBased: true,
        unit: 'person',
        year,
        minAdults,
        barLliure: true,
        barLliureRates: {
          noMinFull: noMin.full,
          noMinHalf: noMin.half,
          siMinFull: siMin.full,
          siMinHalf: siMin.half,
          premium,
        },
      });
    }
  });

  return byVenue;
}

function buildPriceMatrixFromMenu(rows) {
  const priceMatrixByVenue = {};

  for (const venue of VENUES) {
    priceMatrixByVenue[venue.id] = {};
  }

  rows.forEach((row, index) => {
    const venueCell = pickColumn(row, SPREADSHEET_COLUMNS.venue);
    const yearCell = pickColumn(row, SPREADSHEET_COLUMNS.year);
    const priceCell = pickColumn(row, SPREADSHEET_COLUMNS.menuPricePerPerson);
    const minCell = pickColumn(row, SPREADSHEET_COLUMNS.menuMinGuests);
    const penaltyCell = pickColumn(row, SPREADSHEET_COLUMNS.menuPenaltyPerPerson);
    const dayCell = pickColumn(row, SPREADSHEET_COLUMNS.menuDays);
    const monthCell = pickColumn(row, SPREADSHEET_COLUMNS.menuMonths);
    const exceptionCell = pickColumn(row, SPREADSHEET_COLUMNS.menuExceptions);

    if (!venueCell || !yearCell || !priceCell) return;

    const venueIds = parseVenueIds(venueCell);
    const year = parseYearCell(yearCell);
    const price = parseMoney(priceCell);
    const minGuests = Math.max(0, Number(minCell ?? 0));
    const penaltyRaw = penaltyCell ?? getDirectCellByNormalizedKey(row, 'PreuComp');
    const minimumPenaltyPerPerson = parseMoney(penaltyRaw);
    const days = parseDays(dayCell);
    const months = parseMonths(monthCell);
    const exceptions = parseExceptions(exceptionCell);

    if (!venueIds.length || !year || price === null || !days.length || !months.length) return;

    for (const venueId of venueIds) {
      if (!priceMatrixByVenue[venueId][year]) {
        priceMatrixByVenue[venueId][year] = {};
      }

      for (const dayOfWeek of days) {
        if (!priceMatrixByVenue[venueId][year][dayOfWeek]) {
          priceMatrixByVenue[venueId][year][dayOfWeek] = [];
        }

        const entry = {
          months,
          price,
          minGuests,
        };

        if (minimumPenaltyPerPerson !== null) {
          entry.minimumPenaltyPerPerson = minimumPenaltyPerPerson;
        }

        if (exceptions.length) {
          entry.exceptions = exceptions;
        }

        priceMatrixByVenue[venueId][year][dayOfWeek].push(entry);
      }
    }
  });

  for (const venueId of Object.keys(priceMatrixByVenue)) {
    for (const year of Object.keys(priceMatrixByVenue[venueId])) {
      for (const dayOfWeek of Object.keys(priceMatrixByVenue[venueId][year])) {
        priceMatrixByVenue[venueId][year][dayOfWeek].sort((a, b) => {
          const aHasPenalty = Number.isFinite(Number(a.minimumPenaltyPerPerson)) ? 1 : 0;
          const bHasPenalty = Number.isFinite(Number(b.minimumPenaltyPerPerson)) ? 1 : 0;
          if (aHasPenalty !== bHasPenalty) return bHasPenalty - aHasPenalty;
          return (b.months?.length || 0) - (a.months?.length || 0);
        });
      }
    }
  }

  return priceMatrixByVenue;
}

function sheetRowsWithHeaders(sheet) {
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

function loadPriceRowsFromWorkbook(workbook) {
  if (!workbook || !workbook.SheetNames) return [];
  const sheetName = workbook.SheetNames.find(name => normText(name) === normText('PreusMenu'));
  if (!sheetName) return [];
  return sheetRowsWithHeaders(workbook.Sheets[sheetName]);
}

function loadBarLliureRowsFromWorkbook(workbook) {
  if (!workbook || !workbook.SheetNames) return [];

  const requiredKeys = ['masies', 'any', 'min', 'simin', 'nomin', 'premium'];

  for (const name of workbook.SheetNames) {
    const rows = sheetRowsWithHeaders(workbook.Sheets[name]);
    if (!rows.length) continue;
    const keys = Object.keys(rows[0] || {}).map(normText);
    const hasBarHeaders = requiredKeys.every(req =>
      keys.some(k => k.includes(req) || req.includes(k))
    );
    if (hasBarHeaders) return rows;
  }
  return [];
}

async function loadPricesFromSpreadsheet(workbook) {
  const rows = loadPriceRowsFromWorkbook(workbook);
  if (!rows.length) {
    console.warn('PreusMenu sheet not found in spreadsheet');
    return {};
  }
  return buildPriceMatrixFromMenu(rows);
}

function applyPriceMatrixToConfig(priceMatrixByVenue) {
  for (const venue of VENUES) {
    if (!PRICE_CONFIG.venues[venue.id]) continue;
    const venueMatrix = priceMatrixByVenue[venue.id];
    if (!venueMatrix) continue;
    PRICE_CONFIG.venues[venue.id].priceMatrix = venueMatrix;
  }
}

export async function loadExtrasFromSpreadsheet() {
  const response = await fetch(SPREADSHEET_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Spreadsheet fetch failed: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const priceMatrix = await loadPricesFromSpreadsheet(workbook);
  applyPriceMatrixToConfig(priceMatrix);

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const extrasByVenue = buildExtrasByVenue(rows);

  const barLliureRows = loadBarLliureRowsFromWorkbook(workbook);
  const barData = buildBarLliureByVenue(barLliureRows);

  for (const venueId in barData) {
    for (const year in barData[venueId]) {
      if (!extrasByVenue[venueId]) extrasByVenue[venueId] = {};
      if (!extrasByVenue[venueId][year]) extrasByVenue[venueId][year] = [];
      extrasByVenue[venueId][year].push({
        id: 'barlliure',
        ...barData[venueId][year][0],
      });
    }
  }

  applySpreadsheetExtras(extrasByVenue);
  return extrasByVenue;
}

export function applySpreadsheetExtras(extrasByVenue) {
  for (const venue of VENUES) {
    const venueExtras = extrasByVenue?.[venue.id] || {};
    for (const year in venueExtras) {
      PRICE_CONFIG.venues[venue.id].extras[year] = venueExtras[year];
    }
  }
}
