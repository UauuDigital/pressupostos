import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadExtrasFromSpreadsheet, applySpreadsheetExtras } from './data/spreadsheet.js';
import App from './App.jsx';

loadExtrasFromSpreadsheet()
  .catch(err => {
    console.error('No s\'han pogut carregar els serveis des del full de càlcul:', err);
    applySpreadsheetExtras({});
  })
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  });
