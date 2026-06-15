import React from 'react';

const DATE_PICKER_MONTHS = {
  ca: ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const DATE_PICKER_DAYS = {
  ca: ['Dl','Dm','Dc','Dj','Dv','Ds','Dg'],
  es: ['Lu','Ma','Mi','Ju','Vi','Sá','Do'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
};

export default function DatePicker({ value, onChange, min, lang = 'ca' }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = value ? new Date(value + 'T12:00:00') : null;
  const minDate = min ? new Date(min + 'T00:00:00') : today;

  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(parsed ? parsed.getMonth() : today.getMonth());
  const containerRef = React.useRef(null);

  const months = DATE_PICKER_MONTHS[lang] || DATE_PICKER_MONTHS.ca;
  const days = DATE_PICKER_DAYS[lang] || DATE_PICKER_DAYS.ca;

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${year}-${mm}-${dd}`);
    setOpen(false);
  }

  function buildGrid() {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const offset = (firstDow + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  function isSelected(day) {
    if (!parsed || !day) return false;
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;
  }

  function isToday(day) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  }

  function isDisabled(day) {
    if (!day) return true;
    const d = new Date(viewYear, viewMonth, day);
    return d < minDate;
  }

  function formatDisplay() {
    if (!parsed) return null;
    const d = parsed.getDate();
    const m = months[parsed.getMonth()];
    const y = parsed.getFullYear();
    return `${d} ${m} ${y}`;
  }

  const grid = buildGrid();
  const displayStr = formatDisplay();

  const canGoPrev = !(viewYear === minDate.getFullYear() && viewMonth <= minDate.getMonth());
  const canGoYear = (dir) => {
    if (dir < 0) return !(viewYear - 1 < minDate.getFullYear());
    return true;
  };

  return (
    <div className="dp-root" ref={containerRef}>
      <button
        type="button"
        className={`dp-trigger${displayStr ? ' dp-trigger--filled' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="dp-trigger-text">
          {displayStr || <span className="dp-placeholder">{lang === 'es' ? 'Selecciona una fecha' : lang === 'en' ? 'Select a date' : 'Selecciona una data'}</span>}
        </span>
        <svg className="dp-trigger-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="dp-overlay">
          <div className="dp-overlay-backdrop" onClick={() => setOpen(false)} />
        <div className="dp-popover">
          <div className="dp-year-row">
            <button type="button" className="dp-nav-btn" onClick={() => canGoYear(-1) && setViewYear(y => y - 1)} disabled={!canGoYear(-1)} aria-label="Any anterior">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="dp-year-label">{viewYear}</span>
            <button type="button" className="dp-nav-btn" onClick={() => setViewYear(y => y + 1)} aria-label="Any següent">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="dp-header">
            <button type="button" className="dp-nav-btn" onClick={prevMonth} disabled={!canGoPrev} aria-label="Mes anterior">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="dp-month-label">{months[viewMonth]}</span>
            <button type="button" className="dp-nav-btn" onClick={nextMonth} aria-label="Mes següent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="dp-grid">
            {days.map(d => (
              <span key={d} className="dp-day-header">{d}</span>
            ))}
            {grid.map((day, i) => (
              <button
                key={i}
                type="button"
                className={`dp-day${day === null ? ' dp-day--empty' : ''}${isSelected(day) ? ' dp-day--selected' : ''}${isToday(day) ? ' dp-day--today' : ''}${isDisabled(day) ? ' dp-day--disabled' : ''}`}
                disabled={isDisabled(day)}
                onClick={() => day && !isDisabled(day) && selectDay(viewYear, viewMonth, day)}
                tabIndex={day && !isDisabled(day) ? 0 : -1}
              >
                {day || ''}
              </button>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
