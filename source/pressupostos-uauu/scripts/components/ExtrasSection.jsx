import React from 'react';
import { getExtras } from '../data/calculator.js';
import { eur } from '../lib/formatters.js';
import { normalizeQuantity } from '../utils/input.js';

export default function ExtrasSection({
  venueId,
  year,
  date,
  guests,
  selectedExtras,
  extraQuantities,
  extraOptions,
  extraVariants,
  onChange,
  onQuantityChange,
  onOptionChange,
  onVariantChange,
}) {
  const [optionalSelection, setOptionalSelection] = React.useState('');
  const extras = React.useMemo(
    () => (venueId && year ? getExtras(venueId, year).filter(e => e.id !== 'barlliure') : []),
    [venueId, year]
  );

  function quantityUnitLabel(extra) {
    if (extra.unit === 'person') return 'persones';
    if (extra.unit === 'pack') return 'packs';
    return 'unitats';
  }

  function quantityInputLabel(extra) {
    if (extra.unit === 'person') return 'Quantes persones?';
    if (extra.unit === 'pack') return 'Quants packs?';
    return 'Quantes unitats?';
  }

  const dow = date ? new Date(date + 'T12:00:00').getDay() : null;
  const month = date ? new Date(date + 'T12:00:00').getMonth() + 1 : null;
  const optionalExtras = extras.filter(e => e.optional);
  const optionalOptions = React.useMemo(() => {
    const counts = new Map();
    return optionalExtras.map(e => {
      const baseLabel = String(e.label || '').trim();
      const condMandatory = e.mandatoryWhen && dow !== null ? e.mandatoryWhen(dow, month) : false;
      const nextCount = (counts.get(baseLabel) || 0) + 1;
      counts.set(baseLabel, nextCount);
      const uniqueLabel = nextCount > 1 ? `${baseLabel} (${nextCount})` : baseLabel;
      const displayLabel = condMandatory ? `${uniqueLabel} — obligatori` : uniqueLabel;
      return { extra: e, baseLabel, displayLabel, condMandatory };
    });
  }, [optionalExtras, dow, month]);
  if (!venueId || !year || !extras.length) return null;

  function parseOptionalSelectionValue(value, { allowPartial = true } = {}) {
    const raw = String(value || '').trim();
    if (!raw) return null;

    const normalized = raw.toLowerCase();
    const exactDisplayMatch = optionalOptions.find(o => o.displayLabel.toLowerCase() === normalized);
    if (exactDisplayMatch) return exactDisplayMatch.extra;

    const exactBaseMatches = optionalOptions.filter(o => o.baseLabel.toLowerCase() === normalized);
    if (exactBaseMatches.length >= 1) return exactBaseMatches[0].extra;

    if (!allowPartial) return null;

    const partialMatches = optionalOptions.filter(o =>
      o.displayLabel.toLowerCase().includes(normalized) || o.baseLabel.toLowerCase().includes(normalized)
    );
    if (partialMatches.length >= 1) return partialMatches[0].extra;

    return null;
  }

  function handleOptionalInputCommit(rawValue) {
    const match = parseOptionalSelectionValue(rawValue);
    if (!match) return;
    handleOptionalSelect(match.id);
  }

  function isExtraSelected(extra) {
    if (extra.quantityBased) {
      const quantity = extraQuantities?.[extra.id] ?? 0;
      return quantity > 0;
    }
    return selectedExtras?.[extra.id] === true;
  }

  function handleOptionalSelect(selectionValue) {
    if (!selectionValue) return;
    const extraId = selectionValue;
    const extra = optionalExtras.find(e => e.id === extraId);
    if (!extra) return;
    const condMandatory = extra.mandatoryWhen && dow !== null ? extra.mandatoryWhen(dow, month) : false;
    const isMandatory = !extra.optional || condMandatory;
    const alreadySelected = isExtraSelected(extra);

    if (isMandatory) {
      setOptionalSelection('');
      return;
    }

    if (!alreadySelected) {
      if (extra.quantityBased) {
        const minQuantity = Math.max(1, Number(extra.minQuantity ?? 1));
        const currentQuantity = Number(extraQuantities?.[extra.id] ?? 0);
        if (currentQuantity < minQuantity) onQuantityChange(extra.id, minQuantity);
      } else {
        onChange(extra.id, true);
      }
    } else {
      if (extra.quantityBased) onQuantityChange(extra.id, 0);
      onChange(extra.id, false);
    }
    setOptionalSelection('');
  }

  function deactivateOptionalExtra(extra) {
    if (!extra || !extra.optional) return;
    if (extra.quantityBased) onQuantityChange(extra.id, 0);
    onChange(extra.id, false);
  }

  const visibleExtras = extras.filter(e => {
    const condMandatory = e.mandatoryWhen && dow !== null ? e.mandatoryWhen(dow, month) : false;
    const isMandatory = !e.optional || condMandatory;
    return isMandatory || isExtraSelected(e);
  });

  return (
    <div className="form-section">
      <div className="section-title">Serveis addicionals</div>
      {optionalExtras.length > 0 && (
        <div className="field optional-services-field" style={{ marginBottom: '16px' }}>
          <label htmlFor="optional-services-select">Afegir o treure servei opcional</label>
          <input
            id="optional-services-select"
            className="variant-select optional-services-combobox"
            list="optional-services-list"
            type="text"
            placeholder="Selecciona o escriu un servei..."
            value={optionalSelection}
            onChange={(ev) => {
              const val = ev.target.value;
              setOptionalSelection(val);
              const match = parseOptionalSelectionValue(val, { allowPartial: false });
              if (match) {
                handleOptionalSelect(match.id);
                setOptionalSelection('');
                ev.target.blur();
              }
            }}
            onBlur={(ev) => {
              handleOptionalInputCommit(ev.target.value);
              setOptionalSelection('');
            }}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                handleOptionalInputCommit(optionalSelection);
                setOptionalSelection('');
              }
            }}
            aria-label="Desplegable amb cerca de serveis opcionals"
          />
          <datalist id="optional-services-list">
            {optionalOptions.map(({ extra, displayLabel }) => {
              const alreadySelected = isExtraSelected(extra);
              return (
                <option key={extra.id} value={displayLabel}>
                  {alreadySelected ? 'seleccionat' : 'no seleccionat'}
                </option>
              );
            })}
          </datalist>
        </div>
      )}
      {visibleExtras.map(e => {
        const condMandatory = e.mandatoryWhen && dow !== null ? e.mandatoryWhen(dow, month) : false;
        const isMandatory = !e.optional || condMandatory;
        const isSelected = isExtraSelected(e);
        const canDeactivate = e.optional && !isMandatory;
        const hasQuantityInput = e.quantityBased;
        const hasExtraUnitInput = !!e.extraUnitPair;
        const quantity = hasQuantityInput ? (extraQuantities?.[e.id] ?? 0) : null;
        const opts = extraOptions?.[e.id] || {};
        const switchOption = Array.isArray(e.extraExtresOptions)
          ? e.extraExtresOptions.find(opt => opt && opt.switchMode)
          : null;
        const hasSwitchOptions = !!switchOption;
        const hasDropdownOptions = e.extraType === 'desplegable' && Array.isArray(e.dropdownOptions) && e.dropdownOptions.length > 0;
        const selectedDropdownOption = hasDropdownOptions
          ? e.dropdownOptions.find(opt => opt.id === opts.dropdownSelection) || e.dropdownOptions[0]
          : null;
        const rawSwitchSelection = String(opts.switchSide ?? opts.extraSelection ?? '').trim().toLowerCase();
        const selectedSwitchSide = ['left', 'esquerra', 'a', '0'].includes(rawSwitchSelection) ? 'left' : 'right';
        const switchCurrentPrice = hasSwitchOptions
          ? (selectedSwitchSide === 'left' ? Number(switchOption.leftPrice ?? 0) : Number(switchOption.rightPrice ?? 0))
          : null;

        const basePrice = Number(e.price || 0);
        let currentPrice = basePrice;
        if (selectedDropdownOption) currentPrice = selectedDropdownOption.price;
        const isLlinda = e.extraType === 'llinda';
        let llindaDetail = null;
        if (e.variants && extraVariants?.[e.id]) {
          const variant = e.variants.find(v => v.id === extraVariants[e.id]);
          if (variant) currentPrice = variant.price;
        } else if (e.pricingFn) {
          currentPrice = e.pricingFn(guests) || 0;
        }
        if (isLlinda) {
          const thresholdMain = Number(e.thresholdMain);
          const thresholdFinal = Number(e.thresholdFinal);
          const thresholdPriceBelow = Number(e.thresholdPriceBelow ?? currentPrice ?? 0);
          const thresholdPriceAbove = Number(e.thresholdPriceAbove ?? 0);
          const hasMain = Number.isFinite(thresholdMain) && thresholdMain > 0;
          const hasFinal = Number.isFinite(thresholdFinal) && thresholdFinal > 0;
          if (hasMain && guests < thresholdMain) {
            currentPrice = Number.isFinite(thresholdPriceBelow) ? thresholdPriceBelow : 0;
            llindaDetail = `Menys de ${thresholdMain}: ${eur(currentPrice)}`;
          } else if (hasFinal && guests > thresholdFinal) {
            const diffGuests = guests - thresholdFinal;
            currentPrice = basePrice + (diffGuests * thresholdPriceAbove);
            llindaDetail = `Més de ${thresholdFinal}: ${eur(basePrice)} + ${eur(thresholdPriceAbove)}/conv.`;
          } else if (hasMain && hasFinal) {
            llindaDetail = `${thresholdMain}-${thresholdFinal}: ${eur(e.price || 0)}`;
          } else if (!hasMain && hasFinal) {
            llindaDetail = `Fins a ${thresholdFinal}: segons convidats`;
          }
        }

        const priceLabel = hasSwitchOptions
          ? `${eur(switchCurrentPrice)} + IVA`
          : hasQuantityInput
            ? `${eur(currentPrice)}/${quantityUnitLabel(e)} + IVA`
            : e.perGuest
              ? `${guests} convidats × ${eur(currentPrice)} + IVA`
              : isLlinda
                ? `${eur(currentPrice)} + IVA`
                : e.pricePerPerson
                  ? `${eur(e.pricePerPerson)}/pers. (mínim ${eur(e.minPrice)}) + IVA`
                  : `${eur(currentPrice)} + IVA`;

        const mandatoryLabel = condMandatory ? 'Obligatori (data sel.)' : 'Obligatori';

        return (
          <div key={e.id} className="extra-item">
            <div className="extra-info">
              <div className="extra-label extra-label-row">
                {e.label}
                {isMandatory && <span className="extra-badge badge-mandatory">{mandatoryLabel}</span>}
                {hasSwitchOptions && (
                  <div className="extra-switch" style={{ marginLeft: '10px', maxWidth: '360px' }}>
                    <div className="toggle-group extra-switch-group" style={{ width: '100%' }}>
                      <button
                        type="button"
                        className={`toggle-btn extra-switch-btn ${selectedSwitchSide === 'left' ? 'active' : ''}`}
                        onClick={() => onOptionChange(e.id, 'switchSide', 'left')}
                      >
                        {switchOption.leftLabel}
                        <span className="extra-switch-price">{eur(switchOption.leftPrice)}</span>
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn extra-switch-btn ${selectedSwitchSide === 'right' ? 'active' : ''}`}
                        onClick={() => onOptionChange(e.id, 'switchSide', 'right')}
                      >
                        {switchOption.rightLabel}
                        <span className="extra-switch-price">{eur(switchOption.rightPrice)}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {hasDropdownOptions && (
                  <select
                    className="variant-select"
                    value={selectedDropdownOption?.id || ''}
                    onChange={(ev) => {
                      onOptionChange(e.id, 'dropdownSelection', ev.target.value);
                      if (!isMandatory && !isSelected) onChange(e.id, true);
                    }}
                    style={{ marginLeft: '10px' }}
                  >
                    {e.dropdownOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {(opt.labels?.ca || opt.label)} ({eur(opt.price)})
                      </option>
                    ))}
                  </select>
              )}

              {e.variants && (hasQuantityInput ? quantity > 0 : selectedExtras[e.id]) && (
                <select
                  className="variant-select"
                  value={extraVariants?.[e.id] || e.variants[0].id}
                  onChange={(ev) => onVariantChange(e.id, ev.target.value)}
                  style={{ marginTop: '8px', display: 'block' }}
                >
                  {e.variants.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.label || v.labelKey || v.id} ({eur(v.price)})
                    </option>
                  ))}
                </select>
              )}

              <div className="extra-price">{priceLabel}</div>
              {llindaDetail && (
                <div className="li-detail" style={{ marginTop: '4px' }}>
                  {llindaDetail}
                </div>
              )}
            </div>

            {hasQuantityInput || hasExtraUnitInput ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {hasQuantityInput && (
                  <div className="extra-quantity">
                    <input
                      className="extra-quantity-input"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder="0"
                      value={quantity}
                      onChange={ev => onQuantityChange(e.id, normalizeQuantity(ev.target.value))}
                      aria-label={quantityInputLabel(e)}
                      title={quantityInputLabel(e)}
                    />
                    <span className="extra-quantity-unit">{quantityUnitLabel(e)}</span>
                  </div>
                )}
                {hasExtraUnitInput && (
                  <div className="extra-quantity">
                    <input
                      className="extra-quantity-input"
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      placeholder="0"
                      value={opts.extraUnitQty ?? 0}
                      onChange={ev => onOptionChange(e.id, 'extraUnitQty', Math.max(0, Math.round(Number(ev.target.value) || 0)))}
                      aria-label={e.extraUnitPair?.label ? `Quants ${e.extraUnitPair.label}?` : 'Quantes unitats extra?'}
                      title={e.extraUnitPair?.label ? `Quants ${e.extraUnitPair.label}?` : 'Quantes unitats extra?'}
                    />
                    <span className="extra-quantity-unit">{(e.extraUnitPair?.label || 'unitats extra')} ({eur(e.extraUnitPair?.price ?? 0)})</span>
                  </div>
                )}
              </div>
            ) : isMandatory ? (
              <div />
            ) : (
              <div />
            )}
            {canDeactivate && (
              <button
                className="extra-remove-btn"
                type="button"
                onClick={() => deactivateOptionalExtra(e)}
                aria-label={`Desactivar ${e.label}`}
                title="Desactivar servei"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
