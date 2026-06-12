function VenueCards({ value, onChange, compact = false }) {
  return (
    <div className={compact ? 'venue-grid venue-grid-compact' : 'venue-grid'}>
      {VENUES.map(v => (
        <button
          key={v.id}
          type="button"
          className={`venue-card ${value === v.id ? 'selected' : ''}`}
          onClick={() => onChange(v.id)}
          aria-pressed={value === v.id}
        >
          <span className="venue-card-name">{v.name}</span>
        </button>
      ))}
    </div>
  );
}
