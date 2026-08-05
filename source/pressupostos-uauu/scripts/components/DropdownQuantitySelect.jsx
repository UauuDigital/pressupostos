import React from 'react';
import { eur } from '../lib/formatters.js';
import { normalizeQuantity } from '../utils/input.js';

export default function DropdownQuantitySelect({
  options,
  selections,
  onChange,
  getLabel,
  getPrice,
  placeholder = 'Selecciona opcions...',
  ariaLabel = 'Desplegable amb quantitat per opció',
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const sel = selections || {};

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(ev) {
      if (containerRef.current && !containerRef.current.contains(ev.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(ev) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const markedOptions = options.filter(opt => Number(sel[opt.id] || 0) > 0);
  const summaryLabel = markedOptions.length === 0
    ? placeholder
    : markedOptions.map(opt => `${getLabel(opt)} ×${sel[opt.id]}`).join(', ');

  return (
    <div className="dqs-container" ref={containerRef}>
      <button
        type="button"
        className="variant-select dqs-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="dqs-trigger-label">{summaryLabel}</span>
        <span className="dqs-trigger-caret">▾</span>
      </button>
      {open && (
        <div className="dqs-popover" role="group" aria-label={ariaLabel}>
          {options.map(opt => {
            const qty = Number(sel[opt.id] || 0);
            return (
              <div key={opt.id} className="dqs-row">
                <div className="dqs-row-info">
                  <span className="dqs-row-label">{getLabel(opt)}</span>
                  <span className="dqs-row-price">{eur(getPrice(opt))}</span>
                </div>
                <input
                  className="extra-quantity-input dqs-row-input"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="0"
                  value={qty ? qty : ''}
                  onChange={ev => onChange(opt.id, normalizeQuantity(ev.target.value))}
                  aria-label={`Quantitat de ${getLabel(opt)}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
