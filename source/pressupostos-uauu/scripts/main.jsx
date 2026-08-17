import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadExtrasFromSpreadsheet, applySpreadsheetExtras, loadCoctelDataFromSpreadsheet } from './data/spreadsheet.js';
import App from './App.jsx';

Promise.all([
  loadExtrasFromSpreadsheet()
    .catch(err => {
      console.error('No s\'han pogut carregar els serveis des del full de càlcul:', err);
      applySpreadsheetExtras({});
    }),
  loadCoctelDataFromSpreadsheet()
    .catch(err => {
      console.error('No s\'han pogut carregar les dades de Còctel des del full de càlcul:', err);
    }),
]).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
});
