import React from 'react';

export default function Toggle({ value, onChange, options }) {
  return (
    <div className="toggle-group">
      {options.map(o => (
        <button key={o.value} className={`toggle-btn ${value === o.value ? 'active' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
