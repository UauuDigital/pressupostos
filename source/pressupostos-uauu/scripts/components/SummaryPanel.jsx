import React from 'react';
import { VENUES, MONTHS_CA } from '../data/constants.js';
import { PDF_TEXT, PRICE_CONFIG } from '../data/config.js';
import { eur } from '../lib/formatters.js';
import { pdfHTML, generateQuotePdfBlob } from '../lib/pdfGenerator.js';

export default function SummaryPanel({ form, quote, extraOptions, lang = 'ca', mobileDrawer = false }) {
  const venue = VENUES.find(v => v.id === form.venue);
  const t = PDF_TEXT[lang] || PDF_TEXT.ca;
  const months = t.months || MONTHS_CA;
  const dateObj = form.date ? new Date(form.date + 'T12:00:00') : null;
  const dateStr = dateObj ? t.dateFormat(dateObj, months) : null;
  const ready = form.venue && form.date && form.guests >= 1 && quote;
  const [sharing, setSharing] = React.useState(false);
  const canShareFiles = typeof navigator !== 'undefined' && !!navigator.share;

  function buildPdfContext() {
    const coupleStr = form.coupleName || t.coupleLabel;
    const randPart = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? String(crypto.getRandomValues(new Uint16Array(1))[0]).padStart(5, '0').slice(-4)
      : String(Math.floor(Math.random() * 9000) + 1000);
    const refNum = `UAUU-${new Date().getFullYear()}-${randPart}`;
    const today = t.dateFormat(new Date(), months);
    const html = pdfHTML({ form, quote, venue, dateStr, coupleStr, refNum, today, lang });
    return { html, refNum, coupleStr };
  }

  function handleExport() {
    const { html } = buildPdfContext();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.focus();
      setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 800);
    }
  }

  async function handleShareWhatsApp() {
    if (sharing) return;
    setSharing(true);
    try {
      const { html, refNum, coupleStr } = buildPdfContext();
      const pdfBlob = await generateQuotePdfBlob(html);
      const file = new File([pdfBlob], `pressupost-uauu-${refNum}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Pressupost UAUU', text: `Pressupost UAUU — ${coupleStr}` });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="summary-panel">
      <div className="summary-venue-name">{venue ? venue.name : <span style={{ opacity: 0 }}>—</span>}</div>
      <div className="s-label">{t.dateLabel}</div>
      <div className="s-date">{dateStr || <span style={{ color: 'var(--color-muted)' }}>— pendent —</span>}</div>

      {!ready && (
        <div className="empty-state">
          <p>{t.emptyState}</p>
        </div>
      )}

      {ready && (
        <>
          <div style={{ flex: 1 }}>
            <div className="line-item">
              <div className="li-left">
                <div className="li-label">{t.menuService}</div>
                <div className="li-detail">{t.menuDetail(form.guests, quote.pricePerPerson)}</div>
              </div>
              <div className="li-amount">{eur(quote.menuBase)}</div>
            </div>

            {quote.shortfall > 0 && (
              <div className="line-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <div className="li-left">
                  <div className="li-label">{t.minSupplement}</div>
                  <div className="li-detail">{t.pdfMinDetail(quote.shortfall, quote.minimumPenaltyPerPerson, quote.minGuests)}</div>
                </div>
                <div className="li-amount">{eur(quote.penaltyAmt)}</div>
              </div>
            )}

            {quote.extrasLines
              .filter(e => {
                if (e.id === 'barlliure') return true;
                return e.computedPrice > 0;
              })
              .map(e => {
                const currentSelectionId = form.extraOptions?.[e.id]?.dropdownSelection;
                const selectedOption = e.dropdownOptions?.find(opt => opt.id === currentSelectionId);

                return (
                  <div key={e.id} className="line-item">
                    <div className="li-left">
                      <div className="li-label">
                        {e.label} {e.isMandatory && <span className="li-mandatory-tag">{t.mandatory}</span>}
                      </div>

                      {selectedOption && (
                        <div className="li-detail">
                          Seleccionat: {selectedOption.labels?.ca || selectedOption.label}
                        </div>
                      )}

                      {e.priceDetail && <div className="li-detail">{e.priceDetail}</div>}
                    </div>
                    <div className="li-amount">{eur(e.computedPrice)}</div>
                  </div>
                );
              })
            }

            <div className="s-divider" />
            <div className="line-item li-muted">
              <div className="li-left"><div className="li-label">{t.subtotal}</div></div>
              <div className="li-amount">{eur(quote.subtotal)}</div>
            </div>
            <div className="line-item li-muted">
              <div className="li-left"><div className="li-label">{t.vat} ({Math.round(PRICE_CONFIG.vatRate * 100)}%)</div></div>
              <div className="li-amount">{eur(quote.vat)}</div>
            </div>
            <div className="s-divider" />
            <div className="total-block">
              <div className="total-label">{t.totalLabel}</div>
              <div className="total-amount">{eur(quote.total)}</div>
            </div>
            <p className="summary-note">{t.footerNote}</p>
            {quote.year !== quote.usedYear && t.fallbackYear && (
              <p className="summary-note summary-note--fallback">{t.fallbackYear(quote.usedYear, quote.year)}</p>
            )}
          </div>
          <button className={`export-btn${mobileDrawer ? ' mobile-summary-export-btn' : ''}`} onClick={handleExport}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Imprimir
          </button>
          {canShareFiles && (
            <button
              className={`export-btn whatsapp-share-btn${mobileDrawer ? ' mobile-summary-export-btn' : ''}`}
              onClick={handleShareWhatsApp}
              disabled={sharing}
              style={{ marginTop: 10 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
              </svg>
              {sharing ? 'Preparant...' : 'Enviar'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
