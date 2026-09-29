import React from 'react';
import { lookupPrice } from '../data/calculator.js';
import { PRICE_CONFIG } from '../data/config.js';
import { DAYS_CA, MONTHS_CA, VENUES } from '../data/constants.js';
import { eur } from '../lib/formatters.js';

const DAY_NAMES = {
  ca: DAYS_CA,
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const UNAVAILABLE_TEXT = {
  ca: (day, venue, options) => options.length
    ? `${day} no és un dia disponible per a ${venue} en aquest mes. Dies disponibles: ${options}.`
    : `No hi ha cap dia disponible per a ${venue} en aquest mes.`,
  es: (day, venue, options) => options.length
    ? `${day} no es un día disponible para ${venue} en este mes. Días disponibles: ${options}.`
    : `No hay ningún día disponible para ${venue} en este mes.`,
  en: (day, venue, options) => options.length
    ? `${day} is not an available day for ${venue} in this month. Available days: ${options}.`
    : `There are no available days for ${venue} in this month.`,
};

// Dies de la setmana (dilluns primer) que tenen preu per a aquesta finca, any i mes.
function availableDays(venueId, year, month, format, names) {
  return [1, 2, 3, 4, 5, 6, 0]
    .filter(dow => lookupPrice(venueId, year, month, dow, format))
    .map(dow => names[dow].toLowerCase())
    .join(', ');
}

export default function DateInfoStrip({ venueId, date, format = 'finca', lang = 'ca' }) {
  if (!venueId || !date) return null;
  const d = new Date(date + 'T12:00:00');
  const year = d.getFullYear(), month = d.getMonth() + 1, dow = d.getDay();
  const slot = lookupPrice(venueId, year, month, dow, format);
  const hasSpreadsheetPriceData = format === 'coctel'
    || Object.keys(PRICE_CONFIG.venues[venueId]?.priceMatrix || {}).length > 0;

  if (!hasSpreadsheetPriceData) return (
    <div className="alert alert-info">Preus d'aquesta finca pendents de configurar.</div>
  );
  if (!slot) {
    const names = DAY_NAMES[lang] || DAY_NAMES.ca;
    const text = UNAVAILABLE_TEXT[lang] || UNAVAILABLE_TEXT.ca;
    const venueName = VENUES.find(v => v.id === venueId)?.name;
    return (
      <div className="alert alert-error">
        {text(names[dow], venueName, availableDays(venueId, year, month, format, names))}
      </div>
    );
  }

  return (
    <div>
      <div className="info-strip">
        <div className="info-strip-item">
          <div className="info-strip-label">Dia</div>
          <div className="info-strip-value">{DAYS_CA[dow]}</div>
        </div>
        <div className="info-strip-item">
          <div className="info-strip-label">Mes</div>
          <div className="info-strip-value">{MONTHS_CA[month - 1]}</div>
        </div>
        <div className="info-strip-item">
          <div className="info-strip-label">Preu/persona</div>
          <div className="info-strip-value">{eur(slot.price)} + IVA</div>
        </div>
        <div className="info-strip-item">
          <div className="info-strip-label">Mínim finca</div>
          <div className="info-strip-value">{slot.minGuests > 0 ? `${slot.minGuests} convidats adults` : 'Sense mínim'}</div>
        </div>
      </div>
      {slot.year < year && (
        <div className="alert alert-info" style={{ marginTop: 12 }}>
          Preus {slot.year} aplicats - tarifes {year} encara no disponibles.
        </div>
      )}
    </div>
  );
}
