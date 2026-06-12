function GuestsControl({ value, onChange }) {
  const [draft, setDraft] = React.useState(String(value));
  const skipNextBlurCommit = React.useRef(false);

  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(nextValue) {
    const next = Number(nextValue);
    if (!Number.isFinite(next)) {
      setDraft(String(value));
      return;
    }
    const clamped = clamp(Math.round(next), 10, 400);
    setDraft(String(clamped));
    onChange(clamped);
  }

  function handleWheel(e) {
    if (!e.currentTarget.matches(':hover')) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const next = clamp(value + delta, 10, 400);
    setDraft(String(next));
    onChange(next);
  }

  return (
    <div className="guests-control">
      <input
        className="guests-display guests-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={e => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onBlur={() => {
          if (skipNextBlurCommit.current) {
            skipNextBlurCommit.current = false;
            return;
          }
          commit(draft);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            skipNextBlurCommit.current = true;
            setDraft(String(value));
            e.currentTarget.blur();
          }
        }}
        onFocus={e => e.target.select()}
        onWheel={handleWheel}
        aria-label="Nombre de convidats"
        title="Escriu un número i prem Enter o surt del camp"
      />
      <div className="guests-sub">convidats</div>
    </div>
  );
}
