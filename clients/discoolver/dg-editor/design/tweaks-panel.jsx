/* ═══════════════════════════════════════════════════════════════
   tweaks-panel.jsx  —  Shared design tweaks system
   Discoolver Guides · All 17 templates import this file
   ═══════════════════════════════════════════════════════════════ */

/* ── Inject panel CSS once ── */
;(function injectStyles() {
  // En modo PDF (?guide=<id>) no montamos el panel
  if (new URLSearchParams(location.search).get('guide')) return;
  if (document.getElementById('tweaks-panel-css')) return;
  const s = document.createElement('style');
  s.id = 'tweaks-panel-css';
  s.textContent = `
    #tweaks-root {
      position: fixed;
      top: 0; right: 0;
      width: 260px;
      height: 100vh;
      background: #1c1c1e;
      border-left: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      color: #e5e5e7;
    }

    .tp-header {
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      flex-shrink: 0;
    }

    .tp-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0 24px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.12) transparent;
    }
    .tp-body::-webkit-scrollbar { width: 4px; }
    .tp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

    .tp-section {
      padding: 14px 16px 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-top: 6px;
    }

    .tp-row {
      padding: 5px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tp-label {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      font-weight: 400;
    }

    .tp-input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 5px;
      color: #f0f0f2;
      font-size: 12px;
      font-family: inherit;
      padding: 5px 8px;
      outline: none;
      transition: border-color 0.15s;
    }
    .tp-input:focus { border-color: rgba(255,255,255,0.28); }

    .tp-radio-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tp-radio-opt {
      cursor: pointer;
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      font-family: inherit;
      transition: all 0.12s;
    }
    .tp-radio-opt:hover { border-color: rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); }
    .tp-radio-opt.active { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); color: #fff; }
    .tp-radio-opt input { display: none; }

    .tp-color-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tp-color-wrap input[type=color] {
      width: 32px;
      height: 24px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 4px;
      background: none;
      cursor: pointer;
      padding: 0;
    }
    .tp-color-val {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .tp-slider-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tp-slider-wrap input[type=range] {
      flex: 1;
      accent-color: rgba(255,255,255,0.7);
      cursor: pointer;
    }
    .tp-slider-val {
      font-size: 11px;
      color: rgba(255,255,255,0.45);
      min-width: 32px;
      text-align: right;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .tp-btn {
      width: 100%;
      padding: 7px 12px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 5px;
      color: rgba(255,255,255,0.75);
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: all 0.12s;
    }
    .tp-btn:hover { background: rgba(255,255,255,0.13); color: #fff; }

    .tp-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 8px 16px;
    }

    /* Shrink canvas to make room for panel */
    body { padding-right: 268px !important; }
  `;
  document.head.appendChild(s);
})();

/* ── useTweaks hook ── */
function useTweaks(defaults) {
  const [state, setState] = React.useState(defaults);
  const setTweak = React.useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);
  return [state, setTweak];
}

/* ── Panel container — mounts into #tweaks-root portal ── */
function TweaksPanel({ children }) {
  // PDF export mode: render nothing
  if (new URLSearchParams(location.search).get('guide')) return null;

  const [portal] = React.useState(() => {
    let el = document.getElementById('tweaks-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tweaks-root';
      document.body.appendChild(el);
    }
    return el;
  });

  return ReactDOM.createPortal(
    <>
      <div className="tp-header">Ajustes</div>
      <div className="tp-body">{children}</div>
    </>,
    portal
  );
}

/* ── Primitives ── */

function TweakSection({ label }) {
  return <div className="tp-section">{label}</div>;
}

function TweakDivider() {
  return <div className="tp-divider" />;
}

function TweakText({ id, label, value, onChange, placeholder }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <input
        id={id}
        className="tp-input"
        type="text"
        value={value}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function TweakTextarea({ id, label, value, onChange, rows = 3 }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <textarea
        id={id}
        className="tp-input"
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ resize: 'vertical', lineHeight: 1.4 }}
      />
    </div>
  );
}

function TweakRadio({ id, label, value, options, onChange }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <div className="tp-radio-group">
        {options.map(opt => (
          <label key={opt} className={`tp-radio-opt${value === opt ? ' active' : ''}`}>
            <input type="radio" name={id} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function TweakColor({ id, label, value, onChange }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <div className="tp-color-wrap">
        <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} />
        <span className="tp-color-val">{value}</span>
      </div>
    </div>
  );
}

function TweakSlider({ id, label, value, min = 0, max = 1, step = 0.05, onChange }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <div className="tp-slider-wrap">
        <input
          id={id}
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="tp-slider-val">{typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : value}</span>
      </div>
    </div>
  );
}

function TweakButton({ label, onClick }) {
  return (
    <div className="tp-row">
      <button className="tp-btn" onClick={onClick}>{label}</button>
    </div>
  );
}

function TweakSelect({ id, label, value, options, onChange }) {
  return (
    <div className="tp-row">
      <span className="tp-label">{label}</span>
      <select id={id} className="tp-input" value={value} onChange={e => onChange(e.target.value)}
        style={{ cursor: 'pointer' }}>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}
