function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pdfHTML({ form, quote, venue, dateStr, coupleStr, refNum, today, lang = 'ca' }) {
  const t = PDF_TEXT[lang] || PDF_TEXT.ca;
  const vatPct = Math.round(PRICE_CONFIG.vatRate * 100);
  const linesRows = [
    `<tr><td class="td-l">${t.menuService}</td><td class="td-r">${eur(quote.menuBase)}</td></tr>`,
    ...(quote.shortfall > 0 ? [`<tr><td class="td-l">${t.minSupplement}<div class="td-sub">${t.pdfMinDetail(quote.guests ?? form.guests, quote.minimumPenaltyPerPerson)}</div></td><td class="td-r">${eur(quote.penaltyAmt)}</td></tr>`] : []),
    ...quote.extrasLines.map(e => `<tr><td class="td-l">${e.label}${e.isMandatory ? ` <span style="font-size:10px;color:#999;font-style:normal">${t.mandatory}</span>` : ''}${e.priceDetail ? `<div class="td-sub">${e.priceDetail}</div>` : ''}</td><td class="td-r">${eur(e.computedPrice)}</td></tr>`),
  ].join('');

  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/>
<title>${t.pdfTitle} ${coupleStr} — UAUU</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cormorant Garamond',Georgia,serif;font-weight:300;color:#1c1c1a;background:#fff;-webkit-font-smoothing:antialiased}
.wrap{max-width:620px;margin:0 auto;padding:64px 60px 80px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px}
.brand{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#7e8c8d;margin-bottom:6px}
.title-pdf{font-size:26px;font-weight:300;font-style:italic}
.ref-label{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#7e8c8d;margin-bottom:3px;text-align:right}
.ref-val{font-size:13px;font-weight:400;text-align:right}
.ref-date{font-family:system-ui,sans-serif;font-size:10px;color:#7e8c8d;margin-top:3px;text-align:right}
.divider{height:1px;background:#eaeced;margin:32px 0}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px 48px;margin-bottom:40px}
.meta-label{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#7e8c8d;margin-bottom:5px}
.meta-val{font-size:17px;font-weight:400}
.meta-val-i{font-size:17px;font-weight:300;font-style:italic}
.tbl-label{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#7e8c8d;margin-bottom:10px}
table{width:100%;border-collapse:collapse}
th{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.13em;text-transform:uppercase;color:#7e8c8d;font-weight:400;padding-bottom:10px;border-bottom:1px solid #1c1c1a;text-align:left}
th:last-child{text-align:right}
.td-l{padding:12px 0;border-bottom:1px solid #eaeced;font-size:15px;font-weight:300;color:#515856;vertical-align:top}
.td-sub{font-family:system-ui,sans-serif;font-size:10px;color:#7e8c8d;margin-top:3px;letter-spacing:0.05em}
.td-r{padding:12px 0;border-bottom:1px solid #eaeced;text-align:right;font-size:15px;font-weight:400;white-space:nowrap;vertical-align:top}
.td-muted{font-size:13px;color:#7e8c8d;padding:8px 0;border-bottom:1px solid #eaeced}
.td-muted-r{font-size:13px;color:#7e8c8d;padding:8px 0;border-bottom:1px solid #eaeced;text-align:right}
.total-td{padding:20px 0;border-top:2px solid #1c1c1a}
.t-label{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#7e8c8d;margin-bottom:4px}
.t-amount{font-size:30px;font-weight:300}
.t-pp{font-size:12px;font-style:italic;color:#7e8c8d;margin-top:3px}
.notes{margin-top:28px;padding:18px;background:#f5f2ed;border-radius:4px;font-size:13px;font-style:italic;color:#515856;line-height:1.6}
.fallback-year-notice{margin-top:16px;font-family:system-ui,sans-serif;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#7e8c8d;font-style:normal}
.footer{margin-top:52px;padding-top:20px;border-top:1px solid #eaeced;display:flex;justify-content:space-between;align-items:flex-end}
.footer-l{font-family:system-ui,sans-serif;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#7e8c8d;margin-bottom:4px}
.footer-v{font-size:12px;font-style:italic;color:#7e8c8d}
.footer-r{font-family:system-ui,sans-serif;font-size:9px;color:#7e8c8d;text-align:right;line-height:1.6}
@page{size:A4;margin:0}
@media print{html,body{width:210mm}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div><div class="brand">UAUU weddings &amp; events</div><div class="title-pdf">${t.pdfTitle}</div></div>
    <div><div class="ref-label">${t.refLabel}</div><div class="ref-val">${refNum}</div><div class="ref-date">${today}</div></div>
  </div>
  <div class="divider"></div>
  <div class="meta-grid">
    <div><div class="meta-label">${t.coupleLabel}</div><div class="meta-val">${coupleStr}</div></div>
    <div><div class="meta-label">${t.dateLabel}</div><div class="meta-val-i">${dateStr || '—'}</div></div>
    <div><div class="meta-label">${t.venueLabel}</div><div class="meta-val">${venue?.name || '—'}</div></div>
    <div><div class="meta-label">${t.guestsLabel}</div><div class="meta-val">${t.guestsUnit(form.guests)}</div></div>
  </div>
  <div class="tbl-label">${t.detailLabel}</div>
  <table>
    <thead><tr><th>${t.conceptCol}</th><th>${t.amountCol}</th></tr></thead>
    <tbody>
      ${linesRows}
      <tr><td class="td-muted">${t.subtotal}</td><td class="td-muted-r">${eur(quote.subtotal)}</td></tr>
      <tr><td class="td-muted">${t.vat} (${vatPct}%)</td><td class="td-muted-r">${eur(quote.vat)}</td></tr>
    </tbody>
    <tfoot>
      <tr><td class="total-td"><div class="t-label">${t.totalLabel}</div><div class="t-amount">${eur(quote.total)}</div></td><td class="total-td"></td></tr>
    </tfoot>
  </table>
  ${form.notes ? `<div class="notes">${escapeHtml(form.notes)}</div>` : ''}
  ${quote.year !== quote.usedYear && t.fallbackYear ? `<div class="fallback-year-notice">${t.fallbackYear(quote.usedYear, quote.year)}</div>` : ''}
  <div class="footer">
    <div><div class="footer-l">UAUU weddings &amp; events</div><div class="footer-v">Avda. Mestre Montaner, 44-45, Igualada (Barcelona)</div><div class="footer-v">info@uauu.cat · +34 634 438 736</div></div>
    <div class="footer-r">${t.footerNote}</div>
  </div>
</div></body></html>`;
}
