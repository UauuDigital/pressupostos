import React from 'react';
import { STAY_VENUE_ID, STAY_CONFIG, STAY_TEXT, EMPTY_STAY, isStayDateAllowed } from '../data/stay.js';
import { eur } from '../lib/formatters.js';
import { normalizeQuantity } from '../utils/input.js';

const AVISO_DATA =
  'Aquesta data queda fora de la disponibilitat del STAY. El pressupost es pot continuar igualment.';

// Files de serveis addicionals de l'estada (camp de l'estat, textos i preu unitari)
function getRows() {
  const { dinnerExtraPrice, brunchExtraPrice, barHourPricePerPerson, includedPeople } = STAY_CONFIG;
  return [
    {
      key: 'dinnerPeople',
      label: 'Sopar',
      unit: 'persones al sopar',
      price: `${eur(dinnerExtraPrice)} per persona a partir de ${includedPeople} + IVA`,
      aria: 'Nombre de persones al sopar del STAY'
    },
    {
      key: 'barHours',
      label: 'Barra lliure',
      unit: 'hores extra',
      price: `${eur(barHourPricePerPerson)} per persona i hora + IVA`,
      aria: 'Hores extra de barra lliure del STAY'
    },
    {
      key: 'brunchPeople',
      label: 'Brunch',
      unit: 'persones al brunch',
      price: `${eur(brunchExtraPrice)} per persona a partir de ${includedPeople} + IVA`,
      aria: 'Nombre de persones al brunch del STAY'
    }
  ];
}

export default function StaySection({ venueId, stay = EMPTY_STAY, date, onChange }) {
  // El STAY s'afegeix des del desplegable de serveis opcionals; aquí només es mostra un cop triat
  if (venueId !== STAY_VENUE_ID || !stay.active) return null;

  const dateAllowed = isStayDateAllowed(date);

  return (
    <div className="form-section stay-section">
      <div className="section-title">Estada · The Wedding Stay</div>

      <div className="stay-head">
        <button
          type="button"
          className="stay-toggle stay-toggle--on"
          onClick={() => onChange(EMPTY_STAY)}
        >
          Treure STAY
        </button>
        <p className="stay-base">
          {eur(STAY_CONFIG.basePrice)} + IVA · {STAY_CONFIG.includedPeople} persones incloses
        </p>
      </div>

      <p
        className={`stay-note${dateAllowed === false ? ' stay-note--alert' : ''}`}
        role="note"
      >
        {STAY_TEXT.ca.availability}
        {dateAllowed === false && <> {AVISO_DATA}</>}
      </p>

      <fieldset className="stay-services">
        <legend className="stay-legend">Serveis de l'estada</legend>
        {getRows().map(row => {
          const value = stay[row.key];
          const id = `stay-${row.key}`;
          return (
            <div key={row.key} className="stay-row">
              <label className="stay-row-label" htmlFor={id}>{row.label}</label>
              <div className="stay-row-input">
                <input
                  id={id}
                  className="extra-quantity-input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={value ? value : ''}
                  onChange={ev => onChange({ [row.key]: normalizeQuantity(ev.target.value) })}
                  aria-label={row.aria}
                />
                <span className="extra-quantity-unit">{row.unit}</span>
              </div>
              <div className="stay-row-price">{row.price}</div>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}
