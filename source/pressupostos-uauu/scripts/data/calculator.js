import { PRICE_CONFIG } from './config.js';
import { wantsDropdown, getOptionLabel } from './parsers.js';
import { normText } from './utils.js';
import { eur } from '../lib/formatters.js';
import { COCTEL_VENUE_GROUP, COCTEL_PRICE_MATRIX, COCTEL_EXTRAS_BY_YEAR } from './coctelPricing.js';

function lookupFincaPrice(venueId, year, month, dow) {
  const v = PRICE_CONFIG.venues[venueId];
  if (!v || !v.priceMatrix) return null;

  const years = Object.keys(v.priceMatrix).map(Number).sort((a, b) => a - b);
  if (!years.length) return null;

  let usedYear = years[0];
  for (const y of years) {
    if (y <= year) usedYear = y;
  }

  const dayMatrix = v.priceMatrix[usedYear];
  if (!dayMatrix || !dayMatrix[dow]) return null;

  const matches = dayMatrix[dow].filter(r => r.months.includes(month));
  if (!matches.length) return null;

  const withPenalty = matches.find(r => Number.isFinite(Number(r.minimumPenaltyPerPerson)));
  const row = withPenalty || matches[0];
  return row ? { ...row, year: usedYear } : null;
}

function lookupCoctelPrice(venueId, year, month, dow) {
  const groupId = COCTEL_VENUE_GROUP[venueId];
  const matrix = groupId && COCTEL_PRICE_MATRIX[groupId];
  if (!matrix) return null;

  const years = Object.keys(matrix).map(Number).sort((a, b) => a - b);
  if (!years.length) return null;

  let usedYear = years[0];
  for (const y of years) {
    if (y <= year) usedYear = y;
  }

  const dayMatrix = matrix[usedYear];
  if (!dayMatrix || !dayMatrix[dow]) return null;

  const matches = dayMatrix[dow].filter(r => r.months.includes(month));
  if (!matches.length) return null;

  const withPenalty = matches.find(r => Number.isFinite(Number(r.minimumPenaltyPerPerson)));
  const row = withPenalty || matches[0];
  return row ? { ...row, year: usedYear } : null;
}

export function lookupPrice(venueId, year, month, dow, format = 'finca') {
  return format === 'coctel'
    ? lookupCoctelPrice(venueId, year, month, dow)
    : lookupFincaPrice(venueId, year, month, dow);
}

function getFincaExtras(venueId, year) {
  const v = PRICE_CONFIG.venues[venueId];
  if (!v || !v.extras) return [];

  const years = Object.keys(v.extras).map(Number).sort((a, b) => a - b);
  if (!years.length) return [];

  let usedYear = years[0];
  for (const y of years) {
    if (y <= year) usedYear = y;
  }

  return v.extras[usedYear] || [];
}

function getCoctelExtras(venueId, year) {
  const years = Object.keys(COCTEL_EXTRAS_BY_YEAR).map(Number).sort((a, b) => a - b);
  if (!years.length) return [];

  let usedYear = years[0];
  for (const y of years) {
    if (y <= year) usedYear = y;
  }

  return (COCTEL_EXTRAS_BY_YEAR[usedYear] || []).filter(e => !e.venueIds || e.venueIds.includes(venueId));
}

export function getExtras(venueId, year, format = 'finca') {
  if (format !== 'coctel') return getFincaExtras(venueId, year);

  // En Còctel es mostren tots els serveis generals (masia/finca) i, a més, se sobreescriuen
  // amb el preu propi del Còctel aquells que ja té documentats (menú infantil, menú de staff).
  const coctelExtras = getCoctelExtras(venueId, year);
  const coctelLabels = new Set(coctelExtras.map(e => normText(e.label)));
  const generalExtras = getFincaExtras(venueId, year).filter(e => !coctelLabels.has(normText(e.label)));

  return [...generalExtras, ...coctelExtras];
}

export function getExtraLabel(extra, lang = 'ca') {
  return String(extra?.labels?.[lang] || extra?.labels?.ca || extra?.label || '').trim();
}

export function computeQuote({ venue, date, guests, format = 'finca', selectedExtras = {}, extraQuantities, extraOptions = {}, extraVariants = {}, lang = 'ca' }) {
  if (!venue || !date || guests < 1) return null;

  const d = new Date(date + 'T12:00:00');
  const year = d.getFullYear(), month = d.getMonth() + 1, dow = d.getDay();
  const slot = lookupPrice(venue, year, month, dow, format);
  if (!slot) return null;

  const minimumPenaltyPerPerson = Number.isFinite(Number(slot.minimumPenaltyPerPerson))
    ? Number(slot.minimumPenaltyPerPerson)
    : 0;

  const menuBase = slot.price * guests;
  const shortfall = Math.max(0, slot.minGuests - guests);
  const penaltyAmt = shortfall > 0 ? shortfall * minimumPenaltyPerPerson : 0;

  const allExtras = getExtras(venue, year, format);

  const quantities = extraQuantities || {};
  const options = extraOptions || {};

  const extrasLines = allExtras.map(e => {
    const isBarLliure = e.id === 'barlliure';
    const extraOpts = options[e.id] || {};
    const quantity = isBarLliure ? (Number(extraOpts.hours) || 0) :
      (e.quantityBased ? Math.max(0, Math.round(Number(quantities[e.id] || 0))) : null);
    const condMandatory = e.mandatoryWhen ? e.mandatoryWhen(dow, month) : false;
    const isMandatory = !e.optional || (e.mandatoryWhen ? e.mandatoryWhen(dow, month) : false);
    const minQuantity = e.quantityBased ? (e.minQuantity ?? 0) : 0;
    const hasDropdownOptions = Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0 && (e.extraType === 'desplegable' || wantsDropdown(e.extraListCell));
    const dropdownSelections = extraOpts.dropdownSelections || {};
    const markedDropdownOptions = hasDropdownOptions
      ? e.dropdownOptions
          .map(opt => ({ opt, qty: Math.max(0, Math.round(Number(dropdownSelections[opt.id] || 0))) }))
          .filter(x => x.qty > 0)
      : [];
    const included = isBarLliure || isMandatory || selectedExtras[e.id] === true || (e.quantityBased && quantity > 0) || (hasDropdownOptions && markedDropdownOptions.length > 0);
    const hasQuantity = e.quantityBased ? quantity >= (e.minQuantity ?? 0) : true;

    let computedPrice = 0;
    let priceDetail = null;

    let currentPrice = e.price || 0;
    let variantSuffix = '';
    let dropdownDetail = null;

    if (hasDropdownOptions && markedDropdownOptions.length > 0) {
      const dropdownTotal = markedDropdownOptions.reduce((sum, x) => sum + (x.qty * Number(x.opt.price || 0)), 0);
      dropdownDetail = markedDropdownOptions
        .map(x => `${x.qty}× ${getOptionLabel(x.opt, lang)} (${eur(x.opt.price)})`)
        .join(' + ');
      currentPrice = dropdownTotal;
    }

    if (e.variants && extraVariants && extraVariants[e.id]) {
      const selectedVariant = e.variants.find(v => v.id === extraVariants[e.id]);
      if (selectedVariant) {
        currentPrice = selectedVariant.price;
        variantSuffix = ` (${selectedVariant.label})`;
      }
    }

    if (e.id === 'barlliure') {
      const rates = e.barLliureRates || {};
      const premium = extraOpts.premium === true;
      const extraHours = Math.max(0, Math.min(3, Number(extraOpts.hours ?? 0)));
      const fullHours = Math.floor(extraHours);
      const halfHours = extraHours - fullHours >= 0.5 ? 1 : 0;
      const adults = Math.max(0, Number(extraOpts.adults ?? guests) || 0);
      const useMinRates = adults < Number(e.minAdults ?? 60);
      const fullRate = Number(useMinRates ? rates.siMinFull : rates.noMinFull ?? rates.noMin ?? rates.siMinFull ?? 0);
      const halfRate = Number(useMinRates ? rates.siMinHalf : rates.noMinHalf ?? rates.noMin ?? rates.siMinHalf ?? fullRate);
      const premiumRate = Number(rates.premium ?? 0);
      const fullPrice = useMinRates ? fullHours * fullRate : fullHours * fullRate * adults;
      const halfPrice = useMinRates ? halfHours * halfRate : halfHours * halfRate * adults;
      const premiumPrice = premium ? adults * premiumRate : 0;
      computedPrice = fullPrice + halfPrice + premiumPrice;
      const extraParts = [];
      if (fullHours > 0) extraParts.push(useMinRates ? `${fullHours}h × ${eur(fullRate)}` : `${fullHours}h × ${adults} × ${eur(fullRate)}`);
      if (halfHours > 0) extraParts.push(useMinRates ? `0,5h × ${eur(halfRate)}` : `0,5h × ${adults} × ${eur(halfRate)}`);
      if (premium) extraParts.push(`premium ${eur(premiumRate)}/pers. × ${adults}`);
      priceDetail = `2h incloses${extraParts.length ? ` · ${extraParts.join(' + ')}` : ''}`;

    } else if (e.quantityBased) {
      const extraUnitQty = Math.max(0, Math.round(Number(extraOpts.extraUnitQty ?? 0)));
      const extraUnitPrice = Number(e.extraUnitPair?.price ?? 0);
      computedPrice = (quantity * currentPrice) + (extraUnitQty * extraUnitPrice);
      const unitLabel = e.unit === 'person' ? 'persones' : e.unit === 'pack' ? 'packs' : 'unitats';
      const extraUnitLabel = e.extraUnitPair ? ` + ${extraUnitQty} ${e.extraUnitPair.label} × ${eur(extraUnitPrice)}` : '';
      priceDetail = `${quantity} ${unitLabel}${variantSuffix} × ${eur(currentPrice)}${extraUnitLabel}`;

    } else if (e.extraUnitPair) {
      const extraUnitQty = Math.max(0, Math.round(Number(extraOpts.extraUnitQty ?? 0)));
      const extraUnitPrice = Number(e.extraUnitPair.price ?? 0);
      computedPrice = currentPrice + (extraUnitQty * extraUnitPrice);
      priceDetail = `${eur(currentPrice)}${extraUnitQty > 0 ? ` + ${extraUnitQty} ${e.extraUnitPair.label} × ${eur(extraUnitPrice)}` : ''}`;

    } else if (e.pricingFn) {
      computedPrice = e.pricingFn(guests) || 0;
      priceDetail = e.pricingFnDetail ? e.pricingFnDetail(guests) : null;

    } else if (e.pricePerPerson) {
      computedPrice = Math.max(guests * e.pricePerPerson, e.minPrice || 0);
      priceDetail = `${guests} pers. × ${eur(e.pricePerPerson)} (mínim ${eur(e.minPrice)})`;

    } else if (e.perGuest) {
      computedPrice = guests * currentPrice;
      priceDetail = `${guests} convidats${variantSuffix} × ${eur(currentPrice)}`;

    } else {
      computedPrice = currentPrice;
    }

    if (e.extraType === 'llinda') {
      const thresholdMain = Number(e.thresholdMain);
      const thresholdFinal = Number(e.thresholdFinal);
      const thresholdPriceBelow = Number(e.thresholdPriceBelow ?? currentPrice ?? 0);
      const thresholdPriceAbove = Number(e.thresholdPriceAbove ?? 0);
      const hasMain = Number.isFinite(thresholdMain) && thresholdMain > 0;
      const hasFinal = Number.isFinite(thresholdFinal) && thresholdFinal > 0;

      if (hasMain && guests < thresholdMain) {
        computedPrice = Number.isFinite(thresholdPriceBelow) ? thresholdPriceBelow : 0;
        priceDetail = `Fixe (< ${thresholdMain} convidats)`;
      } else if (hasFinal && guests > thresholdFinal) {
        const diffGuests = guests - thresholdFinal;
        const basePrice = Number(e.price ?? currentPrice ?? 0);
        computedPrice = basePrice + (diffGuests * thresholdPriceAbove);
        priceDetail = `${eur(basePrice)} + (${diffGuests} × ${eur(thresholdPriceAbove)})`;
      }
    }

    if (hasDropdownOptions && dropdownDetail) {
      priceDetail = priceDetail ? `${dropdownDetail} · ${priceDetail}` : dropdownDetail;
    }

    return { ...e, isMandatory, condMandatory, included: included && hasQuantity, computedPrice, priceDetail };
  }).filter(e => e.included);

  const extrasTotal = extrasLines.reduce((s, e) => s + e.computedPrice, 0);
  const subtotal = menuBase + penaltyAmt + extrasTotal;
  const vat = subtotal * PRICE_CONFIG.vatRate;
  const total = subtotal + vat;

  return {
    format,
    year, month, dow, usedYear: slot.year,
    pricePerPerson: slot.price,
    minGuests: slot.minGuests,
    minimumPenaltyPerPerson,
    menuBase, shortfall, penaltyAmt,
    extrasLines: extrasLines.map(e => ({ ...e, label: getExtraLabel(e, lang) })),
    extrasTotal, subtotal, vat, total,
    perPerson: total / guests,
  };
}
