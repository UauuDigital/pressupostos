function DateInfoStrip({ venueId, date }) {
  if (!venueId || !date) return null;
  const d = new Date(date + 'T12:00:00');
  const year = d.getFullYear(), month = d.getMonth() + 1, dow = d.getDay();
  const slot = lookupPrice(venueId, year, month, dow);
  const hasSpreadsheetPriceData = Object.keys(PRICE_CONFIG.venues[venueId]?.priceMatrix || {}).length > 0;

  if (!hasSpreadsheetPriceData) return (
    <div className="alert alert-info">Preus d'aquesta finca pendents de configurar.</div>
  );
  if (!slot) return (
    <div className="alert alert-error">
      {DAYS_CA[dow]} no és un dia disponible per a {VENUES.find(v => v.id === venueId)?.name}. Tria divendres, dissabte o diumenge.
    </div>
  );

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
          <div className="info-strip-value">{slot.minGuests} convidats</div>
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
