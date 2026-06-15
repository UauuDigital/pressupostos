import { SPREADSHEET_COLUMNS, VENUES } from './constants.js';
import { normText, parseMoney, buildServiceId } from './utils.js';

export function pickColumn(row, keys) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (keys.some(alias => normalizedKey === normText(alias) || normalizedKey.includes(normText(alias)) || normText(alias).includes(normalizedKey))) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnStrict(row, keys) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (keys.some(alias => normalizedKey === normText(alias))) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnExcluding(row, keys, excludedPatterns = []) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (excludedPatterns.some(p => normalizedKey.includes(normText(p)))) continue;
    if (keys.some(alias => normalizedKey === normText(alias) || normalizedKey.includes(normText(alias)) || normText(alias).includes(normalizedKey))) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnExcludingStrict(row, keys, excludedPatterns = []) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (excludedPatterns.some(p => normalizedKey.includes(normText(p)))) continue;
    if (keys.some(alias => {
      const a = normText(alias);
      return normalizedKey === a || normalizedKey.includes(a);
    })) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnLoose(row, patterns) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (patterns.every(p => normalizedKey.includes(normText(p)))) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnLooseExcluding(row, patterns, excludedPatterns = []) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (excludedPatterns.some(p => normalizedKey.includes(normText(p)))) continue;
    if (patterns.every(p => normalizedKey.includes(normText(p)))) {
      return row[key];
    }
  }
  return undefined;
}

export function pickColumnRegex(row, regexList) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (regexList.some(rx => rx.test(normalizedKey))) return row[key];
  }
  return undefined;
}

export function pickColumnRegexExcluding(row, regexList, excludedPatterns = []) {
  for (const key of Object.keys(row)) {
    const normalizedKey = normText(key);
    if (excludedPatterns.some(p => normalizedKey.includes(normText(p)))) continue;
    if (regexList.some(rx => rx.test(normalizedKey))) return row[key];
  }
  return undefined;
}

export function parseExtraType(value) {
  const txt = normText(value).replace(/[^a-z0-9\s-]/g, ' ');
  if (!txt.trim()) return null;
  if (/(despleg|dropdown|select|selector|opcio|opcion|opciones)/.test(txt)) return 'desplegable';
  if (/(llinda|header|titol|titulo)/.test(txt)) return 'llinda';
  if (/(altres|otros|other)/.test(txt)) return 'altres-extres';
  return null;
}

export function wantsDropdown(extraListCell) {
  const txt = normText(extraListCell);
  return /(^|[\s,;/|])despleg/.test(txt) || txt === 'desplegable';
}

export function getOptionLabel(option, lang = 'ca') {
  return String(option?.labels?.[lang] || option?.labels?.ca || option?.label || '').trim();
}

export function parseServiceNames(row) {
  const ca = pickColumn(row, SPREADSHEET_COLUMNS.nameCa) ?? pickColumn(row, SPREADSHEET_COLUMNS.name);
  const es = pickColumn(row, SPREADSHEET_COLUMNS.nameEs);
  const en = pickColumn(row, SPREADSHEET_COLUMNS.nameEn);
  const base = String(ca ?? es ?? en ?? '').trim();
  if (!base) return null;
  return {
    ca: String(ca ?? base).trim(),
    es: String(es ?? ca ?? base).trim(),
    en: String(en ?? ca ?? base).trim(),
  };
}

export function parseJsonOptions(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const ca = String(item.CAT ?? item.ca ?? item.Ca ?? item.label ?? item.name ?? '').trim();
      const es = String(item.CAST ?? item.cast ?? item.es ?? item.ES ?? ca).trim();
      const en = String(item.ENG ?? item.eng ?? item.en ?? item.EN ?? ca).trim();
      const price = parseMoney(item.PREU ?? item.price ?? item.preu ?? item.amount);
      if (!ca) return null;
      return { id: `${buildServiceId(ca, idx)}-${idx + 1}`, labels: { ca, es, en }, label: ca, price: price ?? 0 };
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export function parseNamePricePair(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const parts = raw.split(',').map(s => s.trim());
  if (parts.length < 2) return null;
  const label = parts[0];
  const price = parseMoney(parts[1]);
  if (!label) return null;
  return { label, price: price ?? 0 };
}

export function parseExtraUnitValue(row) {
  for (const key of Object.keys(row || {})) {
    if (normText(key) === 'extraunitat') {
      return row[key];
    }
  }
  return '';
}

export function parseExtraExtresValue(row) {
  const rawValue = pickColumn(row, SPREADSHEET_COLUMNS.extraExtresKind);
  const swValue =
    pickColumn(row, SPREADSHEET_COLUMNS.extraSwitch) ??
    pickColumnLoose(row, ['switch']) ??
    '';
  const isUsefulText = (value) => {
    const txt = String(value ?? '').trim();
    return !!txt && txt !== 'true' && txt !== 'false';
  };
  const splitTokens = (text) => String(text ?? '').trim().split(/[,\n;|]+/).map(s => s.trim()).filter(Boolean);
  const findSwitchText = () => {
    const directCandidates = [swValue, rawValue]
      .filter(isUsefulText)
      .map(v => String(v).trim());
    for (const candidate of directCandidates) {
      if (candidate.includes(',') && splitTokens(candidate).length >= 4) return candidate;
    }
    for (const key of Object.keys(row || {})) {
      const normalizedKey = normText(key);
      if (!normalizedKey.includes('switch') && !normalizedKey.includes('extra')) continue;
      const value = row[key];
      if (!isUsefulText(value)) continue;
      const candidate = String(value).trim();
      if (candidate.includes(',') && splitTokens(candidate).length >= 4) return candidate;
    }
    return '';
  };
  const raw = String(rawValue ?? '').trim();
  const sw = findSwitchText();
  const parseSwitch = (text) => {
    const rawText = String(text ?? '').trim();
    if (!rawText) return [];
    const tokens = splitTokens(rawText);
    const parseSwitchBlock = (startIdx) => {
      if (tokens.length - startIdx < 4) return null;
      const maybePrice1 = parseMoney(tokens[startIdx + 1]);
      const maybePrice2 = parseMoney(tokens[startIdx + 3]);
      if (tokens.length - startIdx >= 8) {
        const labels = {
          ca: tokens[startIdx],
          es: tokens[startIdx + 1],
          en: tokens[startIdx + 2],
        };
        const leftPrice = parseMoney(tokens[startIdx + 3]);
        const rightLabels = {
          ca: tokens[startIdx + 4],
          es: tokens[startIdx + 5],
          en: tokens[startIdx + 6],
        };
        const rightPrice = parseMoney(tokens[startIdx + 7]);
        if (!labels.ca || !rightLabels.ca) return null;
        return {
          leftLabels: labels,
          leftPrice: leftPrice ?? 0,
          rightLabels,
          rightPrice: rightPrice ?? 0,
        };
      }
      const leftLabel = tokens[startIdx];
      const leftPrice = maybePrice1;
      const rightLabel = tokens[startIdx + 2];
      const rightPrice = maybePrice2;
      if (!leftLabel || !rightLabel) return null;
      return {
        leftLabels: { ca: leftLabel, es: leftLabel, en: leftLabel },
        leftPrice: leftPrice ?? 0,
        rightLabels: { ca: rightLabel, es: rightLabel, en: rightLabel },
        rightPrice: rightPrice ?? 0,
      };
    };
    const parsed = parseSwitchBlock(0);
    if (!parsed) return [];
    return [{
      id: `${buildServiceId(parsed.leftLabels.ca, 0)}-${buildServiceId(parsed.rightLabels.ca, 1)}-switch`,
      labels: { ca: parsed.leftLabels.ca, es: parsed.leftLabels.es, en: parsed.leftLabels.en },
      label: parsed.leftLabels.ca,
      leftLabel: parsed.leftLabels.ca,
      leftLabels: parsed.leftLabels,
      leftPrice: parsed.leftPrice,
      rightLabel: parsed.rightLabels.ca,
      rightLabels: parsed.rightLabels,
      rightPrice: parsed.rightPrice,
      defaultSide: 'right',
      switchMode: true,
    }];
  };
  const parsePairs = (text) => {
    const rawText = String(text ?? '').trim();
    if (!rawText) return [];
    const tokens = splitTokens(rawText);
    const out = [];
    for (let i = 0; i + 1 < tokens.length; i += 2) {
      const ca = tokens[i];
      const price = parseMoney(tokens[i + 1]);
      if (!ca) continue;
      out.push({ id: `${buildServiceId(ca, i)}-${(i / 2) + 1}`, labels: { ca, es: ca, en: ca }, label: ca, price: price ?? 0 });
    }
    return out;
  };
  return [...parsePairs(raw), ...parseSwitch(sw)];
}

export function parseVenueIds(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  const normalizedRaw = normText(raw);
  if (
    raw === '*' ||
    normalizedRaw === 'totes' ||
    normalizedRaw === 'all' ||
    normalizedRaw.includes('totes') ||
    normalizedRaw.includes('all')
  ) {
    return VENUES.map(v => v.id);
  }
  const normalized = normalizedRaw;
  const rawTokens = normalized
    .split(/[,;/|+\n]/)
    .map(t => t.trim())
    .filter(Boolean);

  return VENUES
    .filter(v => {
      const venueName = normText(v.name);
      const venueId = normText(v.id);
      if (normalized.includes(venueName) || normalized.includes(venueId)) return true;
      return rawTokens.some(t => t === venueName || t === venueId || t.includes(venueName) || venueName.includes(t));
    })
    .map(v => v.id)
    .filter((id, idx, arr) => arr.indexOf(id) === idx);
}
