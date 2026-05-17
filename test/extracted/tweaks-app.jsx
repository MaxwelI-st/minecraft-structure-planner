// Tweaks + 個別要素エディター + Claude 指示文エクスポート

// ─── Style Presets ────────────────────────────────────────────────
const STYLE_PRESETS = {
  glass: {
    label: '🌫 グラスモーフィズム',
    css: (t, c) => {
      const acc = t.accentColor || '#4ade80';
      const h1 = (hexToHue(acc) + 220) % 360;
      const h2 = (hexToHue(acc) + 280) % 360;
      const h3 = (hexToHue(acc) + 200) % 360;
      return `
        body {
          background:
            radial-gradient(circle at 15% 12%, oklch(0.5 0.18 ${h1} / ${t.dark ? 0.4 : 0.22}) 0%, transparent 38%),
            radial-gradient(circle at 88% 22%, oklch(0.55 0.2 ${h2} / ${t.dark ? 0.35 : 0.2}) 0%, transparent 42%),
            radial-gradient(circle at 32% 92%, oklch(0.52 0.22 ${(hexToHue(acc)+30)%360} / ${t.dark ? 0.3 : 0.18}) 0%, transparent 40%),
            radial-gradient(circle at 78% 78%, oklch(0.5 0.18 ${h3} / ${t.dark ? 0.28 : 0.15}) 0%, transparent 38%),
            ${c.bg} !important;
          background-attachment: fixed !important;
        }
        body::before { display: none !important; }
        .main-content { background: transparent !important; }
        :root { --glass-blur: blur(${t.blur}px); }

        .glass-card, .stat-card, .block-card, .structure-card,
        .settings-section, .modal, .dotart-toolbar, .dotart-canvas-area,
        .dotart-materials, .viewer3d-container, .v3d-footer-controls,
        .v3d-side-panel, .tool-card {
          background: ${c.cardRgba} !important;
          backdrop-filter: blur(${t.blur}px) saturate(180%) brightness(1.05) !important;
          -webkit-backdrop-filter: blur(${t.blur}px) saturate(180%) brightness(1.05) !important;
          border: 1px solid rgba(255,255,255,${t.dark ? 0.12 : 0.5}) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,${t.dark ? 0.10 : 0.6}),
            inset 0 0 0 1px rgba(255,255,255,${t.dark ? 0.04 : 0.2}),
            0 1px 2px rgba(0,0,0,${t.dark ? 0.15 : 0.04}),
            0 24px 48px -12px rgba(0,0,0,${t.dark ? 0.55 : 0.12}),
            0 4px 12px rgba(0,0,0,${t.dark ? 0.25 : 0.06}) !important;
        }
        .sidebar {
          background: ${t.dark ? 'rgba(8,12,22,0.55)' : 'rgba(255,255,255,0.45)'} !important;
          backdrop-filter: blur(${t.blur}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${t.blur}px) saturate(180%) !important;
          border-right: 1px solid rgba(255,255,255,${t.dark ? 0.08 : 0.3}) !important;
        }
      `;
    },
  },
  neumorphism: {
    label: '🥚 ニューモーフィズム',
    css: (t, c) => `
      :root { --glass-blur: blur(0px); }
      body { background: ${c.bg} !important; }
      .glass-card, .stat-card, .block-card, .structure-card,
      .settings-section, .modal, .dotart-toolbar, .dotart-canvas-area,
      .dotart-materials, .viewer3d-container, .v3d-footer-controls,
      .v3d-side-panel, .tool-card {
        background: ${c.bg} !important;
        backdrop-filter: none !important;
        border: 0 !important;
        box-shadow: 8px 8px 20px ${c.shadowDark}, -8px -8px 20px ${c.shadowLight} !important;
      }
      .mc-btn, .icon-btn, .filter-pill, .tab-pill, .tool-btn {
        background: ${c.bg} !important;
        box-shadow: 4px 4px 10px ${c.shadowDark}, -4px -4px 10px ${c.shadowLight} !important;
        border: 0 !important;
      }
    `,
  },
  clay: {
    label: '🧱 クレイモーフィズム',
    css: (t, c) => `
      :root { --glass-blur: blur(0px); }
      body { background: linear-gradient(135deg, ${c.bg}, ${c.bg2}) !important; }
      .glass-card, .stat-card, .block-card, .structure-card,
      .settings-section, .modal, .dotart-toolbar, .dotart-canvas-area,
      .dotart-materials, .viewer3d-container, .v3d-footer-controls,
      .v3d-side-panel, .tool-card {
        background: ${t.dark ? 'rgba(60, 50, 90, 0.85)' : 'rgba(255, 255, 255, 0.9)'} !important;
        border: 0 !important;
        border-radius: ${Math.max(t.radius, 18)}px !important;
        box-shadow:
          inset 0 -8px 12px ${t.dark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.08)'},
          inset 0 8px 12px ${t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'},
          0 16px 32px ${t.dark ? 'rgba(0,0,0,0.35)' : 'rgba(150,120,200,0.25)'} !important;
      }
    `,
  },
  aurora: {
    label: '🌌 オーロラ',
    css: (t, c) => `
      :root { --glass-blur: blur(${t.blur}px); }
      body {
        background:
          radial-gradient(at 12% 18%, ${c.aurora1} 0px, transparent 50%),
          radial-gradient(at 82% 28%, ${c.aurora2} 0px, transparent 50%),
          radial-gradient(at 28% 78%, ${c.aurora3} 0px, transparent 50%),
          radial-gradient(at 78% 88%, ${c.aurora4} 0px, transparent 50%),
          ${c.bg} !important;
        background-attachment: fixed !important;
      }
      body::before { display: none !important; }
      .main-content { background: transparent !important; }
      .sidebar { background: rgba(0,0,0,${t.dark ? 0.35 : 0.08}) !important;
                 backdrop-filter: blur(${t.blur}px) !important; }
      .glass-card, .stat-card, .block-card, .structure-card,
      .settings-section, .modal, .dotart-toolbar, .dotart-canvas-area,
      .dotart-materials, .viewer3d-container, .v3d-footer-controls,
      .v3d-side-panel, .tool-card {
        background: ${t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)'} !important;
        backdrop-filter: blur(${t.blur}px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(${t.blur}px) saturate(180%) !important;
        border: 1px solid rgba(255,255,255,${t.dark ? 0.12 : 0.5}) !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
      }
    `,
  },
  brutalism: {
    label: '⬛ ネオブルータリズム',
    css: (t, c) => `
      :root { --glass-blur: blur(0px); }
      body { background: ${t.dark ? '#0a0a0a' : '#fef9c3'} !important; }
      body::before { display: none !important; }
      .main-content { background: transparent !important; }
      .glass-card, .stat-card, .block-card, .structure-card,
      .settings-section, .modal, .dotart-toolbar, .dotart-canvas-area,
      .dotart-materials, .viewer3d-container, .v3d-footer-controls,
      .v3d-side-panel, .tool-card {
        background: ${t.dark ? '#1a1a1a' : '#ffffff'} !important;
        backdrop-filter: none !important;
        border: 3px solid ${t.dark ? '#fff' : '#000'} !important;
        border-radius: ${Math.min(t.radius, 4)}px !important;
        box-shadow: 6px 6px 0 ${t.dark ? '#fff' : '#000'} !important;
      }
      .mc-btn, .icon-btn, .filter-pill, .tab-pill {
        border: 2.5px solid ${t.dark ? '#fff' : '#000'} !important;
        border-radius: ${Math.min(t.radius, 4)}px !important;
        box-shadow: 4px 4px 0 ${t.dark ? '#fff' : '#000'} !important;
      }
    `,
  },
};

function buildColors(t) {
  // bgHue: 背景色から導出
  const hue = hexToHue(t.bgColor || '#0d1525');
  const accentHue = hexToHue(t.accentColor || '#4ade80');
  const dark = t.dark;
  const bg  = t.bgColor || (dark ? `oklch(0.13 0.025 ${hue})` : `oklch(0.97 0.012 ${hue})`);
  const bg2 = dark ? `oklch(0.18 0.03  ${hue})` : `oklch(0.93 0.018 ${hue})`;
  const sidebar = dark ? `oklch(0.15 0.025 ${hue})` : `oklch(0.95 0.012 ${hue})`;
  const text = dark ? '#e2e8f0' : '#1a1d24';
  const muted = '#64748b';
  const muted2 = dark ? '#94a3b8' : '#475569';
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const border2 = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
  const cardBase = dark ? '20, 26, 40' : '255, 255, 255';
  const cardRgba = `rgba(${cardBase}, ${t.cardOpacity})`;
  const shadowDark = dark ? 'rgba(0,0,0,0.7)' : 'rgba(150,160,180,0.5)';
  const shadowLight = dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,1)';
  const aurora1 = `oklch(0.65 0.2 ${accentHue})`;
  const aurora2 = `oklch(0.62 0.18 ${(accentHue + 80) % 360})`;
  const aurora3 = `oklch(0.6 0.18 ${(accentHue + 180) % 360})`;
  const aurora4 = `oklch(0.65 0.2 ${(accentHue + 260) % 360})`;
  return { bg, bg2, sidebar, text, muted, muted2, border, border2,
           cardRgba, shadowDark, shadowLight, aurora1, aurora2, aurora3, aurora4 };
}

function hexToHue(hex) {
  if (!hex || !hex.startsWith('#')) return 145;
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return 145;
  const [r, g, b] = m.map(x => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) + (g < b ? 6 : 0);
  else if (max === g) h = ((b - r) / d) + 2;
  else h = ((r - g) / d) + 4;
  return Math.round(h * 60);
}

function shadeHex(hex, amount) {
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(x => parseInt(x, 16));
  const adj = v => Math.max(0, Math.min(255, Math.round(v + 255 * amount / 100)));
  return '#' + [adj(r), adj(g), adj(b)].map(v => v.toString(16).padStart(2,'0')).join('');
}

function applyTweaks(t) {
  const r = document.documentElement;
  const c = buildColors(t);
  const accent = t.accentColor || '#4ade80';
  const accentDark = shadeHex(accent, -12);

  r.style.setProperty('--bg', c.bg);
  r.style.setProperty('--bg2', c.bg2);
  r.style.setProperty('--sidebar', c.sidebar);
  r.style.setProperty('--card', c.cardRgba);
  r.style.setProperty('--card-hover', c.cardRgba);
  r.style.setProperty('--border', c.border);
  r.style.setProperty('--border2', c.border2);
  r.style.setProperty('--text', c.text);
  r.style.setProperty('--muted', c.muted);
  r.style.setProperty('--muted2', c.muted2);
  r.style.setProperty('--primary', accent);
  r.style.setProperty('--primary-d', accentDark);
  r.style.setProperty('--accent', accent);
  r.style.setProperty('--radius', `${t.radius}px`);
  r.style.setProperty('--radius-lg', `${t.radius + 6}px`);
  r.style.setProperty('--glass-blur', `blur(${t.blur}px)`);
  document.body.style.color = c.text;
  document.body.style.background = c.bg;

  let styleEl = document.getElementById('__style-preset');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = '__style-preset';
    document.head.appendChild(styleEl);
  }
  const preset = STYLE_PRESETS[t.style] || STYLE_PRESETS.glass;
  let css = preset.css({ ...t, accent }, c);

  if (!t.dark) {
    css += `
      body, .main-content { color: ${c.text} !important; }
      .mc-input, .search-input, .control-select, .size-input {
        background: rgba(0,0,0,0.04) !important;
        color: ${c.text} !important;
        border-color: ${c.border2} !important;
      }
      .mc-btn.secondary, .icon-btn, .filter-pill, .tab-pill, .tool-btn, .mult-btn {
        background: rgba(0,0,0,0.04) !important;
        color: ${c.text} !important;
      }
      .tab-btn { color: ${c.muted2} !important; }
      .tab-btn.active { background: ${c.cardRgba} !important; color: ${accent} !important; }
      .sidebar { background: ${c.sidebar} !important; }
      .modal { background: ${t.style === 'aurora' ? 'rgba(255,255,255,0.85)' : c.bg2} !important;
               color: ${c.text} !important; }
      .stat-label, .section-label, .toolbar-label { color: ${c.muted2} !important; }
      .empty-hint, .pi-meta, .sc-meta, .block-stack { color: ${c.muted} !important; }
      .check-vis { background: rgba(255,255,255,0.6) !important;
                   border-color: rgba(0,0,0,0.3) !important; }
    `;
  }
  styleEl.textContent = css;
}

function applyOverrides(overrides) {
  let styleEl = document.getElementById('__twk-overrides');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = '__twk-overrides';
    document.head.appendChild(styleEl);
  }
  const rules = Object.entries(overrides).map(([sel, props]) => {
    const body = Object.entries(props)
      .filter(([k]) => !k.startsWith('_'))
      .map(([k, v]) => `  ${k}: ${v} !important;`).join('\n');
    return `${sel} {\n${body}\n}`;
  }).join('\n\n');
  styleEl.textContent = rules;
}

// ─── Element picker logic ─────────────────────────────────────────
function bestSelectorFor(el) {
  // 無視する汎用クラス
  const ignore = new Set(['active', 'hidden', 'prepared', 'highlighted', 'glass-card']);
  const klasses = [...el.classList].filter(c => !ignore.has(c) && !c.startsWith('twk-'));
  if (klasses.length > 0) return '.' + klasses[0];
  if (el.id) return '#' + el.id;
  return el.tagName.toLowerCase();
}

function ElementPicker({ active, onPick }) {
  const [hoverEl, setHoverEl] = React.useState(null);

  React.useEffect(() => {
    if (!active) {
      document.body.style.cursor = '';
      return;
    }
    document.body.style.cursor = 'crosshair';

    const onOver = (e) => {
      if (e.target.closest('.twk-panel') || e.target.closest('.twk-element-editor')
          || e.target.closest('.twk-picker-outline')) return;
      setHoverEl(e.target);
    };
    const onClick = (e) => {
      if (e.target.closest('.twk-panel') || e.target.closest('.twk-element-editor')
          || e.target.closest('.twk-picker-outline')) return;
      e.preventDefault();
      e.stopPropagation();
      onPick(bestSelectorFor(e.target), e.target);
    };
    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('click', onClick, true);
      document.body.style.cursor = '';
      setHoverEl(null);
    };
  }, [active, onPick]);

  if (!active || !hoverEl) return null;
  const rect = hoverEl.getBoundingClientRect();
  return (
    <div className="twk-picker-outline" style={{
      position: 'fixed', pointerEvents: 'none', zIndex: 2147483645,
      left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      outline: '2px dashed #4ade80', outlineOffset: '-1px',
      background: 'rgba(74,222,128,0.06)',
    }}>
      <div style={{
        position: 'absolute', top: -22, left: 0, fontSize: 11, fontWeight: 700,
        background: '#4ade80', color: '#000', padding: '2px 6px', borderRadius: 4,
        whiteSpace: 'nowrap',
      }}>{bestSelectorFor(hoverEl)}</div>
    </div>
  );
}

// ─── Per-element morphism mini-presets ────────────────────────────
const EL_MORPH = {
  none: { label: 'なし', icon: '○', preview: null },
  glass: {
    label: 'グラス',
    icon: '🌫',
    preview: (acc) => ({
      background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.25)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
    }),
    apply: (acc) => ({
      'background-color': 'rgba(255,255,255,0.06)',
      'backdrop-filter': 'blur(20px) saturate(160%)',
      '-webkit-backdrop-filter': 'blur(20px) saturate(160%)',
      'border': '1px solid rgba(255,255,255,0.12)',
      'box-shadow': '0 8px 32px rgba(0,0,0,0.25)',
    }),
  },
  neumorphism: {
    label: 'ニューモ',
    icon: '🥚',
    preview: (acc) => ({
      background: '#2a2a30',
      borderRadius: 10,
      boxShadow: '3px 3px 6px rgba(0,0,0,0.55), -3px -3px 6px rgba(255,255,255,0.06)',
    }),
    apply: (acc) => ({
      'background-color': 'var(--bg2)',
      'backdrop-filter': 'none',
      '-webkit-backdrop-filter': 'none',
      'border': 'none',
      'box-shadow': '8px 8px 20px rgba(0,0,0,0.5), -8px -8px 20px rgba(255,255,255,0.04)',
    }),
  },
  clay: {
    label: 'クレイ',
    icon: '🧱',
    preview: (acc) => ({
      background: 'linear-gradient(135deg, #7a5fa8, #4a3a78)',
      borderRadius: 12,
      boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.18), 0 6px 14px rgba(0,0,0,0.35)',
    }),
    apply: (acc) => ({
      'background-color': 'rgba(60,50,90,0.85)',
      'border-radius': '22px',
      'border': 'none',
      'box-shadow': 'inset 0 -8px 12px rgba(0,0,0,0.25), inset 0 8px 12px rgba(255,255,255,0.06), 0 16px 32px rgba(0,0,0,0.35)',
    }),
  },
  aurora: {
    label: 'オーロラ',
    icon: '🌌',
    preview: (acc) => ({
      background: `linear-gradient(135deg, ${acc}66, ${shadeHex(acc, 35)}66), radial-gradient(at 30% 30%, ${acc}50, transparent 60%)`,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.25)',
      boxShadow: `0 4px 16px ${acc}30`,
    }),
    apply: (acc) => ({
      'background': `linear-gradient(135deg, ${acc}30, ${shadeHex(acc, 20)}30)`,
      'backdrop-filter': 'blur(20px) saturate(180%)',
      '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
      'border': `1px solid ${acc}40`,
      'box-shadow': `0 8px 32px ${acc}25`,
    }),
  },
  brutalism: {
    label: 'ブルータル',
    icon: '⬛',
    preview: (acc) => ({
      background: '#fff',
      borderRadius: 2,
      border: '2px solid #000',
      boxShadow: '3px 3px 0 #000',
    }),
    apply: (acc) => ({
      'background-color': '#1a1a1a',
      'backdrop-filter': 'none',
      '-webkit-backdrop-filter': 'none',
      'border': '3px solid #fff',
      'border-radius': '2px',
      'box-shadow': '6px 6px 0 #fff',
    }),
  },
};

// ─── Visual Morphism Selector (shared by global + element editor) ──
function MorphismGrid({ value, onChange, accent, dark = true, includeNone = false }) {
  const ids = includeNone
    ? Object.keys(EL_MORPH)
    : Object.keys(EL_MORPH).filter(k => k !== 'none');
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${ids.length}, 1fr)`,
      gap: 5,
      padding: 6,
      borderRadius: 8,
      background: dark
        ? `linear-gradient(135deg, ${accent}10, transparent 70%), rgba(0,0,0,0.18)`
        : `linear-gradient(135deg, ${accent}15, transparent 70%), rgba(0,0,0,0.04)`,
    }}>
      {ids.map(id => {
        const m = EL_MORPH[id];
        const isSelected = value === id;
        const previewStyle = m.preview ? m.preview(accent) : {
          background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 8px)',
          border: '1px dashed rgba(255,255,255,0.2)',
        };
        return (
          <button key={id} onClick={() => onChange(id)} title={m.label}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '6px 2px 4px', borderRadius: 7,
              background: 'transparent', border: 0, cursor: 'pointer',
              outline: isSelected ? `2px solid ${accent}` : '1px solid transparent',
              outlineOffset: -1,
              transition: 'transform 0.15s, outline 0.15s',
              transform: isSelected ? 'translateY(-1px)' : 'none',
            }}>
            <div style={{
              width: '100%', height: 26, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: id === 'brutal' ? '#000' : '#fff',
              textShadow: id === 'brutal' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
              ...previewStyle,
            }}>
              {m.icon}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, lineHeight: 1.1,
              color: isSelected ? accent : (dark ? 'rgba(226,232,240,0.7)' : 'rgba(41,38,27,0.65)'),
            }}>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Element editor popover ───────────────────────────────────────
function ElementEditor({ selector, override, onChange, onClose, accentColor }) {
  const update = (k, v) => onChange({ ...override, [k]: v });
  const clear = (...keys) => {
    const next = { ...override };
    keys.forEach(k => delete next[k]);
    onChange(next);
  };
  const getNum = (key, def, fromOpacity = false) => {
    const v = override[key];
    if (v === undefined || v === null) return def;
    if (fromOpacity) return Math.round(parseFloat(v) * 100);
    const m = String(v).match(/^([\d.]+)/);
    return m ? parseFloat(m[1]) : def;
  };

  const applyMorph = (id) => {
    if (id === 'none') {
      clear('background-color', 'background', 'backdrop-filter', '-webkit-backdrop-filter',
        'border', 'border-radius', 'box-shadow', '_morph');
    } else {
      onChange({ ...override, _morph: id, ...EL_MORPH[id].apply(accentColor) });
    }
  };

  return (
    <div className="twk-element-editor" style={{
      position: 'fixed', right: 312, bottom: 16, width: 268,
      maxHeight: 'calc(100vh - 32px)', overflow: 'auto',
      background: 'rgba(20,22,28,0.94)', color: '#e2e8f0',
      backdropFilter: 'blur(24px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)', zIndex: 2147483646,
      font: '11.5px/1.4 ui-sans-serif, system-ui, sans-serif',
      padding: '12px 14px',
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:10,opacity:0.55,textTransform:'uppercase',letterSpacing:'0.06em'}}>個別編集</div>
          <code style={{fontSize:12,color:'#4ade80',fontWeight:600,
            overflow:'hidden',textOverflow:'ellipsis',display:'block',whiteSpace:'nowrap'}}>{selector}</code>
        </div>
        <button onClick={onClose} style={{
          background:'transparent',border:0,color:'#94a3b8',cursor:'pointer',
          fontSize:14,padding:'2px 6px',
        }}>✕</button>
      </div>

      <ElSection>モーフィング</ElSection>
      <MorphismGrid value={override._morph || 'none'} onChange={applyMorph}
        accent={accentColor} includeNone />

      <ElSection>カラー</ElSection>
      <ElRow label="背景色" onReset={() => clear('background-color', 'background', '_bgAlpha')}>
        <ColorRow value={override['background-color'] || '#1a1a2a'}
          onChange={v => update('background-color', v)} />
      </ElRow>
      <ElSlider label="背景の透明度" value={getNum('_bgAlpha', 100)} min={0} max={100} unit="%"
        onReset={() => clear('_bgAlpha')}
        onChange={v => {
          const hex = (override['background-color'] || '#1a1a2a').replace('#','');
          const r = parseInt(hex.slice(0,2),16) || 26;
          const g = parseInt(hex.slice(2,4),16) || 26;
          const b = parseInt(hex.slice(4,6),16) || 42;
          onChange({ ...override, _bgAlpha: v,
            'background-color': `rgba(${r}, ${g}, ${b}, ${v/100})` });
        }} />
      <ElRow label="文字色" onReset={() => clear('color')}>
        <ColorRow value={override['color'] || '#e2e8f0'}
          onChange={v => update('color', v)} />
      </ElRow>

      <ElSection>形状</ElSection>
      <ElSlider label="角丸" value={getNum('border-radius', 8)} min={0} max={48} unit="px"
        onReset={() => clear('border-radius')}
        onChange={v => update('border-radius', `${v}px`)} />
      <ElSlider label="パディング" value={getNum('padding', 8)} min={0} max={48} unit="px"
        onReset={() => clear('padding')}
        onChange={v => update('padding', `${v}px`)} />
      <ElSlider label="背景ぼかし" value={getNum('_backdropBlur', 0)} min={0} max={40} unit="px"
        onReset={() => clear('_backdropBlur', 'backdrop-filter', '-webkit-backdrop-filter')}
        onChange={v => {
          if (v === 0) onChange({ ...override, _backdropBlur: 0, 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' });
          else onChange({ ...override, _backdropBlur: v,
            'backdrop-filter': `blur(${v}px) saturate(160%)`,
            '-webkit-backdrop-filter': `blur(${v}px) saturate(160%)` });
        }} />
      <ElSlider label="要素全体の不透明度" value={getNum('opacity', 100, true)} min={0} max={100} unit="%"
        onReset={() => clear('opacity')}
        onChange={v => update('opacity', `${v/100}`)} />

      <ElSection>ボーダー・影</ElSection>
      <ElSlider label="ボーダー幅" value={getNum('border-width', 0)} min={0} max={8} unit="px"
        onReset={() => clear('border', '_borderColor')}
        onChange={v => update('border', `${v}px solid ${override['_borderColor'] || '#4ade80'}`)} />
      <ElRow label="ボーダー色">
        <ColorRow value={override['_borderColor'] || '#4ade80'}
          onChange={v => {
            const w = getNum('border-width', 0);
            onChange({ ...override, _borderColor: v, border: `${w}px solid ${v}` });
          }} />
      </ElRow>
      <ElSlider label="影の強さ" value={getNum('_shadowSize', 0)} min={0} max={40} unit="px"
        onReset={() => clear('_shadowSize', 'box-shadow')}
        onChange={v => {
          if (v === 0) onChange({ ...override, _shadowSize: 0, 'box-shadow': 'none' });
          else onChange({ ...override, _shadowSize: v,
            'box-shadow': `0 ${Math.round(v/3)}px ${v}px rgba(0,0,0,0.3)` });
        }} />
      <ElSlider label="浮き上がり (elevation)" value={getNum('_elevation', 0)} min={0} max={32} unit="px"
        onReset={() => clear('_elevation', 'transform', 'box-shadow')}
        onChange={v => {
          if (v === 0) {
            clear('_elevation', 'transform');
          } else {
            const sz = getNum('_shadowSize', 0);
            const baseShadow = sz > 0 ? `0 ${Math.round(sz/3)}px ${sz}px rgba(0,0,0,0.3), ` : '';
            onChange({ ...override, _elevation: v,
              transform: `translateY(-${v}px)`,
              'box-shadow': `${baseShadow}0 ${v * 1.5}px ${v * 2.5}px rgba(0,0,0,0.4)` });
          }
        }} />
      <ElSlider label="発光 (glow)" value={getNum('_glow', 0)} min={0} max={40} unit="px"
        onReset={() => clear('_glow', '_glowColor')}
        onChange={v => {
          const color = override['_glowColor'] || accentColor || '#4ade80';
          const sz = getNum('_shadowSize', 0);
          const ev = getNum('_elevation', 0);
          const parts = [];
          if (sz > 0) parts.push(`0 ${Math.round(sz/3)}px ${sz}px rgba(0,0,0,0.3)`);
          if (ev > 0) parts.push(`0 ${ev * 1.5}px ${ev * 2.5}px rgba(0,0,0,0.4)`);
          if (v > 0) parts.push(`0 0 ${v}px ${color}`);
          onChange({ ...override, _glow: v,
            'box-shadow': parts.length > 0 ? parts.join(', ') : 'none' });
        }} />

      <button onClick={() => onChange({})} style={{
        width:'100%', marginTop:12, padding:'7px 8px', borderRadius:6,
        background:'rgba(248,113,113,0.15)', color:'#f87171',
        border:'1px solid rgba(248,113,113,0.3)', cursor:'pointer',
        fontSize:11, fontWeight:600,
      }}>🗑 この要素の全調整をリセット</button>
    </div>
  );
}

function ElSection({ children }) {
  return <div style={{
    fontSize:10, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
    color:'#94a3b8', marginTop:6, marginBottom:4, borderBottom:'1px solid rgba(255,255,255,0.08)',
    paddingBottom:3,
  }}>{children}</div>;
}

function ElRow({ label, children, onReset }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:3,marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,color:'rgba(226,232,240,0.65)'}}>
        <span>{label}</span>
        {onReset && (
          <button onClick={onReset} title="このプロパティをリセット" style={{
            background:'transparent',border:0,color:'rgba(226,232,240,0.4)',
            cursor:'pointer',fontSize:11,padding:'0 3px',lineHeight:1,
          }}>↺</button>
        )}
      </div>
      {children}
    </div>
  );
}
function ColorRow({ value, onChange }) {
  // rgba を含む場合は #rrggbb を取り出す
  const hex = React.useMemo(() => {
    if (!value) return '#1a1a2a';
    if (value.startsWith('#')) return value.slice(0, 7);
    const m = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (m) return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    return '#1a1a2a';
  }, [value]);
  return (
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      <input type="color" value={hex} onChange={e => onChange(e.target.value)}
        style={{width:38,height:26,border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:4,padding:0,background:'transparent',cursor:'pointer'}} />
      <input type="text" value={value || hex} onChange={e => onChange(e.target.value)}
        style={{flex:1,minWidth:0,height:26,padding:'0 6px',borderRadius:4,
          border:'1px solid rgba(255,255,255,0.15)',background:'rgba(0,0,0,0.3)',
          color:'#e2e8f0',fontSize:11,fontFamily:'ui-monospace, monospace'}} />
    </div>
  );
}
function ElSlider({ label, value, min, max, onChange, onReset, unit = '' }) {
  return (
    <ElRow label={label} onReset={onReset}>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{flex:1,accentColor:'#4ade80'}} />
        <span style={{fontSize:10,color:'rgba(226,232,240,0.55)',
          fontVariantNumeric:'tabular-nums',minWidth:30,textAlign:'right'}}>{value}{unit}</span>
      </div>
    </ElRow>
  );
}

// ─── Claude prompt builder ────────────────────────────────────────
function buildClaudePrompt(t, overrides) {
  const c = buildColors(t);
  const accent = t.accentColor || '#4ade80';
  const accentDark = shadeHex(accent, -12);
  const preset = STYLE_PRESETS[t.style];

  const cleanOverrides = Object.fromEntries(
    Object.entries(overrides).map(([sel, props]) => [
      sel, Object.fromEntries(Object.entries(props).filter(([k]) => !k.startsWith('_')))
    ]).filter(([_, p]) => Object.keys(p).length > 0)
  );

  const overrideCSS = Object.entries(cleanOverrides).map(([sel, props]) => {
    const body = Object.entries(props).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n');
    return `${sel} {\n${body}\n}`;
  }).join('\n\n');

  const presetCSS = preset.css({ ...t, accent }, c).trim();

  return `# Structure Planner — デザイン変更指示

以下の設定でアプリ全体のデザインを更新してください。css/style.css と必要に応じて index.html を編集してOKです。

## 全体設定
- **スタイル系統**: ${preset.label}
- **モード**: ${t.dark ? '🌙 Dark' : '☀️ Light'}
- **アクセントカラー**: ${accent}
- **背景カラー**: ${t.bgColor || c.bg}
- **角丸**: ${t.radius}px
- **ぼかし**: ${t.blur}px
- **パネル透明度**: ${Math.round(t.cardOpacity * 100)}%

## :root に追加するCSS変数

\`\`\`css
:root {
  --bg: ${c.bg};
  --bg2: ${c.bg2};
  --sidebar: ${c.sidebar};
  --card: ${c.cardRgba};
  --card-hover: ${c.cardRgba};
  --border: ${c.border};
  --border2: ${c.border2};
  --text: ${c.text};
  --muted: ${c.muted};
  --muted2: ${c.muted2};
  --primary: ${accent};
  --primary-d: ${accentDark};
  --accent: ${accent};
  --radius: ${t.radius}px;
  --radius-lg: ${t.radius + 6}px;
  --glass-blur: blur(${t.blur}px);
}
\`\`\`

## スタイルプリセット（${t.style}）追加CSS

\`\`\`css
${presetCSS}
\`\`\`
${cleanOverrides && Object.keys(cleanOverrides).length > 0 ? `
## 個別要素の調整

\`\`\`css
${overrideCSS}
\`\`\`
` : ''}
## 適用方法
1. \`css/style.css\` の \`:root\` の値を上記で上書き
2. プリセットCSSと個別調整CSSは style.css の末尾に追記（!important で既存値より優先させる）
3. ライトモードの場合、ハードコードされたダーク色（\`rgba(0,0,0,0.x)\` のinput背景など）も合わせて適切に書き換える

そのまま実装お願いします。`;
}

// ─── App ──────────────────────────────────────────────────────────
function GlobalColorPicker({ label, value, presets = [], presetLabels = {}, onChange }) {
  const hex = value && value.startsWith('#') ? value : '#1a1a2a';
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:2}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <span style={{fontSize:11,color:'rgba(41,38,27,0.72)',fontWeight:500}}>{label}</span>
        <span style={{fontSize:10,color:'rgba(41,38,27,0.5)',fontFamily:'ui-monospace, monospace'}}>
          {value || '—'}
        </span>
      </div>
      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        <input type="color" value={hex} onChange={e => onChange(e.target.value)}
          style={{width:30,height:24,border:'1px solid rgba(0,0,0,0.15)',
            borderRadius:5,padding:0,background:'transparent',cursor:'pointer',flexShrink:0}} />
        {presets.map((p, i) => (
          <button key={p+i} onClick={() => onChange(p)} title={presetLabels[p] || p}
            style={{
              flex: 1, height: 24, borderRadius: 5, border: 0, cursor: 'pointer',
              background: p || 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%)',
              backgroundSize: p ? 'auto' : '8px 8px',
              outline: value === p ? '2px solid #29261b' : '1px solid rgba(0,0,0,0.15)',
              outlineOffset: value === p ? -1 : 0, padding: 0,
              fontSize: 9, color: '#29261b', fontWeight: 600,
            }}>{!p ? '自動' : ''}</button>
        ))}
      </div>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "glass",
  "dark": true,
  "accentColor": "#4ade80",
  "bgColor": "",
  "radius": 12,
  "blur": 16,
  "cardOpacity": 0.55,
  "overrides": {}
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [pickMode, setPickMode] = React.useState(false);
  const [selected, setSelected] = React.useState(null); // selector string

  React.useEffect(() => { applyTweaks(t); }, [t.style, t.dark, t.accentColor, t.bgColor,
    t.radius, t.blur, t.cardOpacity]);
  React.useEffect(() => { applyOverrides(t.overrides || {}); }, [t.overrides]);

  const onPick = React.useCallback((selector) => {
    setSelected(selector);
    setPickMode(false);
  }, []);

  const updateOverride = (newProps) => {
    const next = { ...(t.overrides || {}) };
    if (!newProps || Object.keys(newProps).length === 0) {
      delete next[selected];
    } else {
      next[selected] = newProps;
    }
    setTweak('overrides', next);
  };

  const copyForClaude = () => {
    const text = buildClaudePrompt(t, t.overrides || {});
    navigator.clipboard.writeText(text).then(() => showToast('✓ Claude用の指示文をコピーしました', '#4ade80'));
  };

  const copyCSS = () => {
    const c = buildColors(t);
    const accent = t.accentColor || '#4ade80';
    const css = `:root {\n  --bg: ${c.bg};\n  --primary: ${accent};\n  --radius: ${t.radius}px;\n  --glass-blur: blur(${t.blur}px);\n}`;
    navigator.clipboard.writeText(css).then(() => showToast('✓ CSS変数をコピーしました', '#4ade80'));
  };

  const reset = () => {
    // 一括で置換してストイル要素もストレートキャッシュを吹く
    setTweak({ ...TWEAK_DEFAULTS });
    // 明示的にオーバーライドスタイルもクリア
    const ov = document.getElementById('__twk-overrides');
    if (ov) ov.textContent = '';
    setSelected(null);
    showToast('⇺ すべてデフォルトに戻しました', '#fbbf24');
  };

  const clearOverrides = () => {
    setTweak('overrides', {});
    const ov = document.getElementById('__twk-overrides');
    if (ov) ov.textContent = '';
    setSelected(null);
    showToast(`⇺ ${overrideCount}件の個別調整をクリアしました`, '#fbbf24');
  };

  const overrideCount = Object.keys(t.overrides || {}).length;

  return (
    <>
      <ElementPicker active={pickMode} onPick={onPick} />
      {selected && (
        <ElementEditor
          selector={selected}
          override={(t.overrides || {})[selected] || {}}
          onChange={updateOverride}
          onClose={() => setSelected(null)}
          accentColor={t.accentColor || '#4ade80'}
        />
      )}
      <TweaksPanel title="🎨 デザイン調整">
        <TweakSection label="スタイル系統" />
        <MorphismGrid value={t.style}
          onChange={(v) => setTweak('style', v)}
          accent={t.accentColor || '#4ade80'} dark={t.dark} />
        <TweakRadio label="モード" value={t.dark ? 'dark' : 'light'}
          options={[{value:'dark',label:'🌙 Dark'},{value:'light',label:'☀️ Light'}]}
          onChange={(v) => setTweak('dark', v === 'dark')} />

        <TweakSection label="カラー" />
        <GlobalColorPicker label="アクセントカラー" value={t.accentColor || '#4ade80'}
          presets={['#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#fbbf24', '#22d3ee', '#ec4899']}
          onChange={(v) => setTweak('accentColor', v)} />
        <GlobalColorPicker label="背景カラー" value={t.bgColor || ''}
          presets={['', '#070c14', '#0a0a0c', '#0f0c08', '#06100a', '#0c0817', '#fafaf9']}
          presetLabels={{'': '自動'}}
          onChange={(v) => setTweak('bgColor', v)} />

        <TweakSection label="形状・質感" />
        <TweakSlider label="角丸" value={t.radius} min={0} max={24} unit="px"
          onChange={(v) => setTweak('radius', v)} />
        <TweakSlider label="ぼかし強度" value={t.blur} min={0} max={32} unit="px"
          onChange={(v) => setTweak('blur', v)} />
        <TweakSlider label="パネル透明度" value={Math.round(t.cardOpacity * 100)}
          min={10} max={100} unit="%"
          onChange={(v) => setTweak('cardOpacity', v / 100)} />

        <TweakSection label={`個別要素編集 ${overrideCount > 0 ? `(${overrideCount})` : ''}`} />
        <TweakButton
          label={pickMode ? '🎯 クリックして要素を選択中... (Escで中止)' : '🎯 要素を選んで編集'}
          onClick={() => setPickMode(!pickMode)} />
        {overrideCount > 0 && (
          <TweakButton label={`🗑 全${overrideCount}件の個別調整をクリア`}
            onClick={clearOverrides} secondary />
        )}

        <TweakSection label="エクスポート" />
        <TweakButton label="🤖 Claudeに渡す指示文をコピー" onClick={copyForClaude} />
        <TweakButton label="📋 :root CSSのみコピー" onClick={copyCSS} secondary />
        <TweakButton label="↺ デフォルトに戻す" onClick={reset} secondary />
      </TweaksPanel>
    </>
  );
}

// ─── toast ───────────────────────────────────────────────────────
function showToast(msg, color = '#4ade80') {
  const tag = document.createElement('div');
  tag.textContent = msg;
  Object.assign(tag.style, {
    position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.88)',
    color, padding: '10px 18px', borderRadius: '8px',
    zIndex: 2147483647, fontSize: '13px', fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  });
  document.body.appendChild(tag);
  setTimeout(() => tag.remove(), 1800);
}

// ESC で個別編集解除
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.body.style.cursor = '';
  }
});

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
