import React from 'react';
import { PRICE_CONFIG } from './data/config.js';
import { computeQuote } from './data/calculator.js';
import { eur } from './lib/formatters.js';
import VenueCards from './components/VenueCards.jsx';
import DatePicker from './components/DatePicker.jsx';
import GuestsControl from './components/GuestsControl.jsx';
import DateInfoStrip from './components/DateInfoStrip.jsx';
import ExtrasSection from './components/ExtrasSection.jsx';
import SummaryPanel from './components/SummaryPanel.jsx';

export default function App() {
  const [form, setForm] = React.useState(() => {
    try {
      localStorage.removeItem('uauu-v2-form');
    } catch { }
    return {
      venue: '',
      date: '',
      guests: 80,
      selectedExtras: {},
      extraQuantities: {},
      extraOptions: {},
      extraVariants: { pernil: 'res' },
      coupleName: '',
      notes: '',
    };
  });
  const [lang, setLang] = React.useState('ca');
  const [showCompactVenues, setShowCompactVenues] = React.useState(false);
  const [renderCompactVenues, setRenderCompactVenues] = React.useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false);
  const venueSectionRef = React.useRef(null);
  const headerRef = React.useRef(null);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setExtra(id, val) {
    setForm(f => ({
      ...f,
      selectedExtras: { ...f.selectedExtras, [id]: val },
      extraQuantities: val ? f.extraQuantities : { ...f.extraQuantities, [id]: 0 }
    }));
  }
  function setQuantity(id, val) { setForm(f => ({ ...f, extraQuantities: { ...f.extraQuantities, [id]: val } })); }
  function setExtraOption(id, key, value) {
    setForm(f => ({
      ...f,
      extraOptions: {
        ...f.extraOptions,
        [id]: { ...(f.extraOptions?.[id] || {}), [key]: value }
      }
    }));
  }
  function setVariant(id, variantId) {
    setForm(f => ({
      ...f,
      extraVariants: { ...f.extraVariants, [id]: variantId }
    }));
  }

  const dateYear = form.date ? new Date(form.date + 'T12:00:00').getFullYear() : null;

  const venueConfig = PRICE_CONFIG.venues[form.venue];

  const barLliureExtra = venueConfig?.extras?.[dateYear]?.find(e => e.id === 'barlliure') || null;

  const hasMountedRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setForm(f => ({ ...f, selectedExtras: {}, extraQuantities: {} }));
  }, [form.venue, dateYear]);

  const quote = React.useMemo(() => {
    try {
      const result = computeQuote({ ...form, lang });
      return result;
    } catch (e) {
      return null;
    }
  }, [form, lang]);

  React.useEffect(() => {
    if (showCompactVenues) {
      setRenderCompactVenues(true);
      return;
    }
    const timer = window.setTimeout(() => setRenderCompactVenues(false), 220);
    return () => window.clearTimeout(timer);
  }, [showCompactVenues]);

  React.useEffect(() => {
    function updateCompactVenues() {
      const section = venueSectionRef.current;
      const header = headerRef.current;
      if (!section || !header) return;

      const headerRect = header.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const scrolledEnough = window.scrollY > 700;
      const mainVenuesHidden = sectionRect.top < headerRect.bottom;
      setShowCompactVenues(scrolledEnough && mainVenuesHidden);
    }

    updateCompactVenues();
    window.addEventListener('scroll', updateCompactVenues, { passive: true });
    window.addEventListener('resize', updateCompactVenues);
    return () => {
      window.removeEventListener('scroll', updateCompactVenues);
      window.removeEventListener('resize', updateCompactVenues);
    };
  }, []);

  return (
    <div>
      <header className="page-header" ref={headerRef}>
        <div className="page-header-side page-header-left">
          <img
            className="page-logo"
            src={(window.__resources && window.__resources.uauuLogo) || 'assets/logo-uauu-black.png'}
            alt="UAUU weddings & events"
          />
        </div>
        <div className="page-header-center">
          <span className="page-header-label">Configurador de Pressupostos</span>
          <div className="lang-selector" aria-label="Selector d'idioma">
            {['ca', 'es', 'en'].map(l => (
              <button
                key={l}
                type="button"
                className={`lang-btn ${lang === l ? 'active' : ''}`}
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="page-header-side page-header-right">
          {renderCompactVenues && (
            <div className={`page-header-venues page-header-venues-right ${showCompactVenues ? 'is-visible' : 'is-hiding'}`}>
              <VenueCards value={form.venue} onChange={v => set('venue', v)} compact />
            </div>
          )}
        </div>
      </header>

      <div className="app-body">
        <div className="form-panel" ref={venueSectionRef}>
          <div className="form-section">
            <div className="section-title">Finca de la boda</div>
            <VenueCards value={form.venue} onChange={v => set('venue', v)} />
          </div>

          <div className="form-section">
            <div className="section-title">Detalls de l'esdeveniment</div>
            <div className="event-details-list">
              <div className="field">
                <label>Data de la boda</label>
                <DatePicker value={form.date} onChange={val => set('date', val)} min={`${new Date().getFullYear()}-01-01`} lang={lang} />
              </div>
              <div className="field">
                <label>Nombre de convidats</label>
                <GuestsControl value={form.guests} onChange={val => set('guests', val)} />
                <input type="range" min={10} max={400} step={1} value={form.guests} onChange={e => set('guests', Number(e.target.value))} />
                <div className="range-labels"><span>10</span><span>400</span></div>
              </div>
            </div>
            <DateInfoStrip venueId={form.venue} date={form.date} />
            {barLliureExtra && (
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="field" style={{ flex: 1 }}>
                    <br></br>
                    <label>Barra lliure</label>
                    <div className="event-extra-price" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span>2 hores incloses al menú</span>
                      <input className="extra-quantity-input" type="number" min={0} max={3} step={0.5} value={form.extraOptions?.barlliure?.hours ?? 0} onChange={e => setExtraOption('barlliure', 'hours', Math.max(0, Math.min(3, Number(e.target.value) || 0)))} aria-label="Hores extres barra lliure" />
                      <span className="extra-quantity-unit">hores extres</span>
                      <button type="button" className={`toggle-btn ${(form.extraOptions?.barlliure?.premium ?? false) ? 'active' : ''}`} onClick={() => setExtraOption('barlliure', 'premium', !(form.extraOptions?.barlliure?.premium ?? false))}>Premium</button>
                    </div>
                  </div>
                </div>
              )}
          </div>

          <ExtrasSection
            venueId={form.venue}
            year={dateYear}
            date={form.date}
            guests={form.guests}
            selectedExtras={form.selectedExtras}
            extraQuantities={form.extraQuantities}
            extraOptions={form.extraOptions}
            extraVariants={form.extraVariants}
            onChange={setExtra}
            onQuantityChange={setQuantity}
            onOptionChange={setExtraOption}
            onVariantChange={setVariant}
          />

          <div className="form-section">
            <div className="section-title">Dades de la parella</div>
            <div className="field-row full" style={{ marginBottom: 20 }}>
              <div className="field">
                <label>Noms de la parella</label>
                <input type="text" placeholder="p. ex. Anna & Marc" value={form.coupleName} className={form.coupleName ? 'filled' : ''} onChange={e => set('coupleName', e.target.value)} />
              </div>
            </div>
            <div className="field-row full">
              <div className="field">
                <label>Notes addicionals</label>
                <textarea rows={3} placeholder="Requisits especials, al·lèrgies, observacions..." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <SummaryPanel form={form} quote={quote} lang={lang} extraOptions={form.extraOptions} />
      </div>

      <div className="mobile-summary-bar">
        <div className="mobile-summary-bar-left">
          <div className="mobile-summary-bar-label">Total estimat</div>
          {quote
            ? <div className="mobile-summary-bar-total">{eur(quote.total)}</div>
            : <div className="mobile-summary-bar-pending">Pendent de dades</div>
          }
        </div>
        <button
          type="button"
          className="mobile-summary-toggle"
          onClick={() => setMobileSummaryOpen(o => !o)}
          aria-expanded={mobileSummaryOpen}
        >
          {mobileSummaryOpen ? 'Tancar' : 'Veure detall'}
        </button>
      </div>

      <div className={`mobile-summary-drawer${mobileSummaryOpen ? ' is-open' : ''}`} aria-hidden={!mobileSummaryOpen}>
        <div className="mobile-summary-backdrop" onClick={() => setMobileSummaryOpen(false)} />
        <div className="mobile-summary-sheet">
          <div className="mobile-summary-sheet-handle" />
          <SummaryPanel form={form} quote={quote} lang={lang} extraOptions={form.extraOptions} mobileDrawer />
        </div>
      </div>
    </div>
  );
}
