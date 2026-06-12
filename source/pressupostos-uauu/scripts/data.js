// ================================================================
//  DATA ENTRY POINT
//  Main aggregation file - all modules must load in order:
//  constants.js → utils.js → parsers.js → config.js → spreadsheet.js → calculator.js → data.js
// ================================================================
//  diaDeLaSetmana: 0=Diumenge, 1=Dl, 2=Dm, 3=Dc, 4=Dj, 5=Dv, 6=Ds
// ================================================================

// Initialize spreadsheet loading when all modules are ready
window.__uauuDataReady = loadExtrasFromSpreadsheet()
  .then(extrasByVenue => {
    applySpreadsheetExtras(extrasByVenue);
    return extrasByVenue;
  })
  .catch(err => {
    console.error('No s\'han pogut carregar els serveis des del full de càlcul:', err);
    applySpreadsheetExtras({});
    return {};
  });

// Export unified API
window.uauuData = {
  // Constants
  MONTHS_CA,
  DAYS_CA,
  DAYS_SHORT,
  VENUES,
  SPREADSHEET_COLUMNS,
  PRICE_CONFIG,
  PDF_TEXT,
  SPREADSHEET_URL,
  
  // Utilities
  eur,
  normText,
  parseMoney,
  parseBool,
  parseYearCell,
  parseUnitStyle,
  buildServiceId,
  
  // Parsers
  pickColumn,
  pickColumnStrict,
  pickColumnExcluding,
  pickColumnExcludingStrict,
  pickColumnLoose,
  pickColumnLooseExcluding,
  pickColumnRegex,
  pickColumnRegexExcluding,
  parseExtraType,
  wantsDropdown,
  getOptionLabel,
  parseServiceNames,
  parseJsonOptions,
  parseNamePricePair,
  parseExtraUnitValue,
  parseExtraExtresValue,
  parseVenueIds,
  
  // Spreadsheet loading
  buildExtrasByVenue,
  parseDays,
  parseMonths,
  parseExceptions,
  buildPriceMatrixFromMenu,
  loadPricesFromSpreadsheet,
  applyPriceMatrixToConfig,
  loadExtrasFromSpreadsheet,
  applySpreadsheetExtras,
  
  // Calculator
  lookupPrice,
  getExtras,
  getExtraLabel,
  computeQuote,
};
