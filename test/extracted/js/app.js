// Structure Planner — Preview Stub
// 見た目プレビュー用：タブ切替・検索・フィルタ・倍率モーダル・サンプル表示

console.info('[Structure Planner] preview stub loaded');

// ─── Demo Data ────────────────────────────────────────────────
const DEMO_PROJECTS = [
  { id: 'p1', name: '村の家', icon: '🏠', mult: 1,
    structures: [{ name: 'village_house.mcstructure', size: '16×12×16', count: 2418 }] },
  { id: 'p2', name: '砂漠の神殿 ×5', icon: '🏛️', mult: 5,
    structures: [
      { name: 'desert_temple_v3.mcstructure', size: '24×18×24', count: 4830 },
      { name: 'sand_path.mcstructure',        size: '12×1×40',  count: 480 },
    ] },
  { id: 'p3', name: '海底都市', icon: '🌊', mult: 1,
    structures: [{ name: 'underwater_city.mcstructure', size: '64×24×64', count: 18420 }] },
];

const DEMO_BLOCKS = [
  { name: 'オークの原木',     id: 'minecraft:oak_log',        count: 1284, color: '#8b6f47', cat: 'building' },
  { name: '石レンガ',        id: 'minecraft:stone_bricks',   count: 856,  color: '#7a7a7a', cat: 'building' },
  { name: '丸石',           id: 'minecraft:cobblestone',    count: 612,  color: '#6b6b6b', cat: 'building' },
  { name: 'ガラス',         id: 'minecraft:glass',          count: 240,  color: '#c8e8f0', cat: 'decoration' },
  { name: '樫の階段',        id: 'minecraft:oak_stairs',     count: 188,  color: '#a47d4f', cat: 'building' },
  { name: '羊毛 (白)',       id: 'minecraft:white_wool',     count: 96,   color: '#eeeeee', cat: 'decoration' },
  { name: 'グロウストーン',    id: 'minecraft:glowstone',      count: 64,   color: '#e8c969', cat: 'decoration' },
  { name: 'シーランタン',     id: 'minecraft:sea_lantern',    count: 32,   color: '#bfe6e0', cat: 'decoration' },
  { name: '土',             id: 'minecraft:dirt',           count: 412,  color: '#6b4a2b', cat: 'nature' },
  { name: 'クォーツブロック',   id: 'minecraft:quartz_block',   count: 220,  color: '#e8e4d8', cat: 'building' },
  { name: 'レンガ',         id: 'minecraft:bricks',         count: 178,  color: '#a64938', cat: 'building' },
  { name: 'シラカバの原木',    id: 'minecraft:birch_log',      count: 144,  color: '#d8d2bc', cat: 'building' },
  { name: 'レッドストーンランプ', id: 'minecraft:redstone_lamp',  count: 48,   color: '#9e6535', cat: 'redstone' },
  { name: 'レッドストーン粉',   id: 'minecraft:redstone_dust',  count: 256,  color: '#c43d3d', cat: 'redstone' },
  { name: 'リピーター',       id: 'minecraft:repeater',       count: 32,   color: '#a89687', cat: 'redstone' },
  { name: '葉ブロック (オーク)', id: 'minecraft:oak_leaves',     count: 320,  color: '#3a6630', cat: 'nature' },
  { name: '草ブロック',       id: 'minecraft:grass_block',    count: 184,  color: '#5d8d3f', cat: 'nature' },
  { name: 'アイテムフレーム',   id: 'minecraft:item_frame',     count: 8,    color: '#a06e3c', cat: 'other' },
];

// ─── State ────────────────────────────────────────────────────
let currentProjectId = 'p1';
let currentSearch = '';
let currentCategory = 'all';
let showIds = false;

// ─── Tab switching ────────────────────────────────────────────
document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p => {
      const on = p.id === `panel-${target}`;
      p.classList.toggle('active', on);
      p.classList.toggle('hidden', !on);
    });
    if (target === 'dotart') drawDotArt();
    if (target === 'viewer3d') draw3DPlaceholder();
  });
});

// ─── Filter pills ─────────────────────────────────────────────
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.toggle('active', p === pill));
    currentCategory = pill.dataset.category || 'all';
    renderBlocks();
  });
});

// ─── Search input ─────────────────────────────────────────────
document.getElementById('search-input')?.addEventListener('input', (e) => {
  currentSearch = e.target.value.toLowerCase();
  renderBlocks();
});

// ─── ID toggle ────────────────────────────────────────────────
document.getElementById('id-toggle')?.addEventListener('change', (e) => {
  showIds = e.target.checked;
  renderBlocks();
});

// ─── Modals ───────────────────────────────────────────────────
document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', () => {
    const m = document.getElementById(el.dataset.modal);
    if (m) m.classList.add('hidden');
  });
});
document.getElementById('btn-new-project')?.addEventListener('click', () =>
  document.getElementById('modal-new-project')?.classList.remove('hidden'));
document.getElementById('btn-create-project-welcome')?.addEventListener('click', () =>
  document.getElementById('modal-new-project')?.classList.remove('hidden'));

// Multiplier modal
document.querySelectorAll('.mult-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.mult;
    document.querySelectorAll('.mult-btn').forEach(b => b.classList.toggle('active', b === btn));
    const input = document.getElementById('custom-mult-input');
    if (val === 'custom') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = val;
    }
  });
});
document.getElementById('btn-confirm-mult')?.addEventListener('click', () => {
  const v = parseInt(document.getElementById('custom-mult-input').value, 10);
  if (v > 0) {
    const proj = DEMO_PROJECTS.find(p => p.id === currentProjectId);
    if (proj) proj.mult = v;
    renderProject();
  }
  document.getElementById('modal-structure')?.classList.add('hidden');
});

// ─── Welcome → Project ────────────────────────────────────────
document.getElementById('btn-drop-file')?.addEventListener('click', () => loadProject('p1'));
document.getElementById('btn-go-home')?.addEventListener('click', () => {
  document.getElementById('welcome-screen')?.classList.remove('hidden');
  document.getElementById('project-view')?.classList.add('hidden');
});

// ─── Renderers ────────────────────────────────────────────────
function renderSidebar() {
  const pl = document.getElementById('project-list');
  if (!pl) return;
  pl.innerHTML = DEMO_PROJECTS.map(p => {
    const total = p.structures.reduce((s, x) => s + x.count, 0) * p.mult;
    const active = p.id === currentProjectId ? ' active' : '';
    return `
      <div class="project-item-container${active}" data-id="${p.id}">
        <button class="project-item-btn">
          <span class="pi-icon">${p.icon}</span>
          <div class="pi-info">
            <span class="pi-name">${p.name}</span>
            <span class="pi-meta">${p.structures.length} 構造 · ${total.toLocaleString()} ブロック</span>
          </div>
        </button>
        <button class="project-item-delete" title="削除">🗑️</button>
      </div>`;
  }).join('');
  pl.querySelectorAll('.project-item-container').forEach(c => {
    c.querySelector('.project-item-btn').addEventListener('click', () => loadProject(c.dataset.id));
  });
}

function renderBlocks() {
  const list = document.getElementById('block-list');
  if (!list) return;
  const proj = DEMO_PROJECTS.find(p => p.id === currentProjectId);
  const mult = proj ? proj.mult : 1;
  const filtered = DEMO_BLOCKS.filter(b => {
    if (currentCategory !== 'all' && b.cat !== currentCategory) return false;
    if (currentSearch && !b.name.toLowerCase().includes(currentSearch)
        && !b.id.toLowerCase().includes(currentSearch)) return false;
    return true;
  });
  if (filtered.length === 0) {
    list.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted)">該当ブロックなし</div>`;
    return;
  }
  list.innerHTML = filtered.map((b, i) => {
    const count = b.count * mult;
    const stacks = Math.ceil(count / 64);
    const shulkers = count > 1500 ? `<span class="shulker-badge">🟪 ${Math.ceil(count/(64*27))}</span>` : '';
    const label = showIds ? b.id : b.name;
    const labelClass = showIds ? 'block-name is-id' : 'block-name';
    return `
      <div class="block-card glass-card${i % 5 === 0 ? ' prepared' : ''}">
        <label class="prepared-label">
          <input type="checkbox" class="prepared-check"${i % 5 === 0 ? ' checked' : ''}>
          <span class="check-vis"></span>
        </label>
        <span class="wiki-overlay">📖</span>
        <div class="block-icon-wrap">
          <div class="block-icon-img" style="background:${b.color};width:32px;height:32px;border:1px solid rgba(0,0,0,0.3);border-radius:3px;box-shadow:inset -2px -2px 0 rgba(0,0,0,0.2),inset 2px 2px 0 rgba(255,255,255,0.15)"></div>
        </div>
        <div class="block-info">
          <div class="${labelClass}" title="${b.id}">${label}</div>
          <div class="block-count">${count.toLocaleString()}</div>
          <div class="block-stack">${stacks} stacks ${shulkers}</div>
        </div>
      </div>`;
  }).join('');
}

function renderProject() {
  const proj = DEMO_PROJECTS.find(p => p.id === currentProjectId);
  if (!proj) return;
  document.getElementById('project-title').textContent = `${proj.icon} ${proj.name}`;
  document.getElementById('project-date').textContent =
    `× ${proj.mult} 倍率 · 最終更新: 2026/05/16`;

  // Structures
  const sl = document.getElementById('structures-list');
  if (sl) {
    sl.innerHTML = proj.structures.map((s, i) => `
      <div class="structure-card glass-card">
        <span class="sc-icon">🧱</span>
        <div class="sc-info">
          <div class="sc-name"><span>${s.name}</span><span class="badge-3d">3D OK</span></div>
          <div class="sc-meta">${s.size} ブロック · ${s.count.toLocaleString()} ブロック</div>
        </div>
        <div class="sc-actions">
          <button class="mc-btn secondary small mult-display" data-mult-trigger>×${proj.mult}</button>
          <button class="icon-btn">⋮</button>
        </div>
      </div>`).join('');
    sl.querySelectorAll('[data-mult-trigger]').forEach(b => {
      b.addEventListener('click', () => {
        document.getElementById('modal-structure')?.classList.remove('hidden');
        document.querySelectorAll('.mult-btn').forEach(mb =>
          mb.classList.toggle('active', mb.dataset.mult == proj.mult));
        const input = document.getElementById('custom-mult-input');
        input.value = proj.mult;
        input.style.display = 'none';
      });
    });
  }

  // Stats
  const baseTotal = proj.structures.reduce((s, x) => s + x.count, 0) * proj.mult;
  document.querySelector('#stat-total .stat-value').textContent = baseTotal.toLocaleString();
  document.querySelector('#stat-unique .stat-value').textContent = DEMO_BLOCKS.length;
  document.querySelector('#stat-stacks .stat-value').textContent = Math.ceil(baseTotal / 64).toLocaleString();
  document.querySelector('#stat-shulkers .stat-value').textContent = Math.ceil(baseTotal / (64*27));

  renderBlocks();
}

function loadProject(id) {
  currentProjectId = id;
  document.getElementById('welcome-screen')?.classList.add('hidden');
  document.getElementById('project-view')?.classList.remove('hidden');
  renderSidebar();
  renderProject();
}

// ─── DotArt demo ──────────────────────────────────────────────
function drawDotArt() {
  const canvas = document.getElementById('dotart-canvas');
  if (!canvas || canvas.dataset.drawn) return;
  canvas.dataset.drawn = '1';
  const cellSize = 12;
  const W = 32, H = 32;
  canvas.width = W * cellSize;
  canvas.height = H * cellSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Mario-ish sample sprite
  const _ = null;
  const R = '#d63838', S = '#f7d2a3', B = '#5a3719', Y = '#f0c040', BL = '#1a3a8a', W2 = '#ffffff', G = '#3a8030';
  const sprite = [
    [_,_,_,_,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,B,B,B,S,S,B,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,B,S,B,S,S,S,B,S,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,B,S,B,B,S,S,S,B,S,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,B,B,S,S,S,S,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,S,S,S,S,S,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,R,R,BL,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,R,R,R,BL,R,R,BL,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,R,R,R,R,BL,BL,BL,BL,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,S,S,R,BL,Y,BL,BL,Y,BL,R,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,S,S,S,BL,BL,BL,BL,BL,BL,S,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,S,S,BL,BL,BL,BL,BL,BL,BL,BL,S,S,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,BL,BL,BL,_,_,_,BL,BL,BL,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,B,B,B,_,_,_,_,_,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,B,B,B,B,_,_,_,_,_,B,B,B,B,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  ];
  // 草の地面（下部）
  for (let y = H - 8; y < H; y++) {
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = y === H - 8 ? G : '#6b4a2b';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  // 雲
  ctx.fillStyle = W2;
  [[22,3],[23,3],[24,3],[23,2],[26,5],[27,5],[26,4]].forEach(([x,y]) =>
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize));

  // スプライト描画（中央寄り）
  const offX = 8, offY = 6;
  sprite.forEach((row, y) => row.forEach((c, x) => {
    if (c) {
      ctx.fillStyle = c;
      ctx.fillRect((x + offX) * cellSize, (y + offY) * cellSize, cellSize, cellSize);
    }
  }));

  // グリッド
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= W; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize + 0.5, 0); ctx.lineTo(i * cellSize + 0.5, H * cellSize);
    ctx.stroke();
  }
  for (let i = 0; i <= H; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize + 0.5); ctx.lineTo(W * cellSize, i * cellSize + 0.5);
    ctx.stroke();
  }

  // パレット
  const pal = document.getElementById('block-palette');
  if (pal && !pal.dataset.drawn) {
    pal.dataset.drawn = '1';
    const colors = [R, S, B, Y, BL, W2, G, '#6b4a2b', '#7a7a7a', '#3a8030', '#d8d2bc', '#a64938'];
    pal.innerHTML = colors.map((c, i) => `
      <button class="palette-btn${i === 0 ? ' active' : ''}" style="background:${c}"></button>
    `).join('');
    pal.querySelectorAll('.palette-btn').forEach(b => {
      b.addEventListener('click', () => {
        pal.querySelectorAll('.palette-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
    });
  }

  // ツール切替
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  // 使用素材リスト
  const ml = document.getElementById('dotart-material-list');
  if (ml) {
    const mats = [
      { name: '赤色の羊毛',     color: R,  count: 32 },
      { name: '茶色のテラコッタ', color: B,  count: 28 },
      { name: '砂',           color: S,  count: 42 },
      { name: '青色の羊毛',     color: BL, count: 18 },
      { name: '黄色の羊毛',     color: Y,  count: 6  },
      { name: '白色の羊毛',     color: W2, count: 14 },
      { name: '草ブロック',     color: G,  count: 32 },
      { name: '土',           color: '#6b4a2b', count: 224 },
    ];
    ml.innerHTML = mats.map(m => `
      <div class="dotart-mat-item">
        <div class="dotart-color" style="background:${m.color}"></div>
        <span class="dotart-mat-name">${m.name}</span>
        <span class="dotart-mat-count">${m.count}</span>
      </div>`).join('');
  }
}

// ─── 3D placeholder ──────────────────────────────────────────
function draw3DPlaceholder() {
  const container = document.getElementById('viewer3d-container');
  if (!container || container.dataset.drawn) return;
  container.dataset.drawn = '1';
  const ph = container.querySelector('.viewer3d-placeholder');
  if (ph) {
    ph.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:1rem">
        <div style="position:relative;width:180px;height:180px;perspective:600px">
          <div class="iso-cube" style="position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-25deg) rotateY(-35deg);animation:isoRotate 18s linear infinite">
            ${['#5d8d3f','#6b4a2b','#7a7a7a','#a47d4f','#e8c969'].map((c,i)=>`
              <div style="position:absolute;width:60px;height:60px;background:${c};border:2px solid rgba(0,0,0,0.4);left:${i*20}px;top:${i*15}px;transform:translateZ(${i*30}px);box-shadow:inset -4px -4px 0 rgba(0,0,0,0.25),inset 4px 4px 0 rgba(255,255,255,0.15)"></div>
            `).join('')}
          </div>
        </div>
        <p style="font-size:0.95rem;color:var(--muted2)">「3D表示を開始」を押してレンダリング</p>
        <p class="hint">カメラ操作: ドラッグ=回転 / 右ドラッグ=パン / ホイール=ズーム</p>
      </div>
      <style>@keyframes isoRotate { to { transform: rotateX(-25deg) rotateY(325deg); } }</style>
    `;
  }
}

// ─── Init ─────────────────────────────────────────────────────
loadProject('p1');


// ─── Theme Presets ────────────────────────────────────────────
const THEMES = [
  // ── Dark: Clean / Work ──
  { id: 'dark-1',   name: 'Default Dark',       kind: 'dark',  tags: ['ベース', 'グラス'],         desc: '元のグリーン×ネイビー' },
  { id: 'dark-10',  name: 'Architect Slate',    kind: 'dark',  tags: ['ブルータル', '灰色'],       desc: '読みやすい灰色×緑' },
  { id: 'dark-5',   name: 'Obsidian Architect', kind: 'dark',  tags: ['ニューモ', 'OLED'],         desc: '純黒モノクローム' },
  // ── Dark: Vivid / Energetic ──
  { id: 'dark-2',   name: 'RTX Neon Glass',     kind: 'dark',  tags: ['グラス', '強発光'],         desc: 'エメラルドのネオン' },
  { id: 'dark-4',   name: 'Stim Rush',          kind: 'dark',  tags: ['ソリッド', 'ビビッド'],     desc: 'ライム×パープル' },
  { id: 'dark-8',   name: 'Retro Terminal',     kind: 'dark',  tags: ['ブルータル', '原色'],       desc: 'シアン×マゼンタ' },
  { id: 'dark-11',  name: 'Cyberpunk Tokyo',    kind: 'dark',  tags: ['サイバー', 'ネオン'],       desc: '黒×電気青×蛍光ピンク' },
  { id: 'dark-3',   name: 'Synthwave Drive',    kind: 'dark',  tags: ['シンセウェーブ', '80s'],    desc: '紫×ピンク×シアン' },
  // ── Dark: Dreamy / Glass ──
  { id: 'dark-12',  name: 'Holographic',        kind: 'dark',  tags: ['ホロ', 'パール'],           desc: '玉虫色メタリック' },
  { id: 'dark-13',  name: 'Sunset Mirage',      kind: 'dark',  tags: ['ホロ', 'コーラル'],         desc: '夕焼け蜃気楼' },
  { id: 'dark-9',   name: 'Aurora Glass',       kind: 'dark',  tags: ['メッシュ', 'グラス'],       desc: '紫×ピンク×マゼンタ' },
  // ── Dark: Warm / Cozy ──
  { id: 'dark-6',   name: 'Midnight Espresso',  kind: 'dark',  tags: ['クレイ', '温色'],           desc: 'コーヒー×オレンジ' },
  { id: 'dark-7',   name: 'Verdant Cathedral',  kind: 'dark',  tags: ['森', '真鍮'],               desc: '深い森×ゴールド' },

  // ── Light: Clean / Work ──
  { id: 'light-9',  name: 'Solar Notes',        kind: 'light', tags: ['作業', 'クリーン'],         desc: 'Solarized風' },
  { id: 'light-2',  name: 'Frosted Crystal',    kind: 'light', tags: ['グラス', 'コバルト'],       desc: '氷ブルー' },
  { id: 'light-6',  name: 'Mint Lab',           kind: 'light', tags: ['クリーン', 'ミント'],       desc: '清潔・サイエンス' },
  // ── Light: Soft Pastel ──
  { id: 'light-1',  name: 'Lavender Mist',      kind: 'light', tags: ['クレイ', 'パステル'],       desc: 'やさしい紫' },
  { id: 'light-8',  name: 'Peony Bloom',        kind: 'light', tags: ['グラス', 'ピンク'],         desc: 'やわらかピンク×ピーチ' },
  { id: 'light-7',  name: 'Latte Cafe',         kind: 'light', tags: ['クレイ', 'ベージュ'],       desc: 'カフェオレ' },
  { id: 'light-5',  name: 'Paper Sage',         kind: 'light', tags: ['ペーパー', 'セージ'],       desc: '麻紙×セージ' },
  { id: 'light-13', name: 'Hydrangea',          kind: 'light', tags: ['グラス', 'アジサイ'],       desc: '青紫×淡ピンク' },
  // ── Light: Vivid / Dreamy ──
  { id: 'light-3',  name: 'Citrus Burst',       kind: 'light', tags: ['ビビッド', '柑橘'],         desc: '太陽×オレンジ×ライム' },
  { id: 'light-10', name: 'Aurora Bright',      kind: 'light', tags: ['メッシュ', 'グラス'],       desc: '薄パステル' },
  // ── Light: Print / Brutal ──
  { id: 'light-4',  name: 'Blueprint Paper',    kind: 'light', tags: ['ブルータル', '紙'],         desc: '青写真の紙' },
  { id: 'light-11', name: 'Vintage Newspaper',  kind: 'light', tags: ['印刷', 'セピア'],           desc: '黄ばみ紙×赤マーカー' },
  { id: 'light-12', name: 'Bento Box',          kind: 'light', tags: ['和モダン', '朱'],           desc: '墨黒×朱赤×山吹' },
  ];


const THEME_FONTS = {
  "dark-1": "'Outfit', 'Noto Sans JP', sans-serif",
  "dark-2": "'Rajdhani', 'Zen Kaku Gothic New', sans-serif",
  "dark-3": "'Press Start 2P', 'DotGothic16', monospace",
  "dark-4": "'Inter', 'Noto Sans JP', sans-serif",
  "dark-5": "'Inter', 'Noto Sans JP', sans-serif",
  "dark-6": "'Crimson Text', 'Noto Serif JP', serif",
  "dark-7": "'Cormorant Garamond', 'Noto Serif JP', serif",
  "dark-8": "'VT323', 'DotGothic16', monospace",
  "dark-9": "'Quicksand', 'Zen Maru Gothic', sans-serif",
  "dark-10": "'Inter', 'Noto Sans JP', sans-serif",
  "dark-11": "'JetBrains Mono', 'Zen Kaku Gothic New', monospace",
  "dark-12": "'Space Grotesk', 'Zen Kaku Gothic New', sans-serif",
  "dark-13": "'Quicksand', 'Zen Maru Gothic', sans-serif",
  "light-1": "'Quicksand', 'Zen Maru Gothic', sans-serif",
  "light-2": "'Manrope', 'Noto Sans JP', sans-serif",
  "light-3": "'Fredoka', 'Zen Maru Gothic', sans-serif",
  "light-4": "'Courier Prime', 'Klee One', monospace",
  "light-5": "'Lora', 'Noto Serif JP', serif",
  "light-6": "'Manrope', 'Noto Sans JP', sans-serif",
  "light-7": "'Caveat', 'Klee One', cursive",
  "light-8": "'Quicksand', 'Zen Maru Gothic', sans-serif",
  "light-9": "'IBM Plex Mono', 'Klee One', monospace",
  "light-10": "'Quicksand', 'Zen Maru Gothic', sans-serif",
  "light-11": "'Playfair Display', 'Noto Serif JP', serif",
  "light-12": "'Shippori Mincho', 'Yu Mincho', serif",
  "light-13": "'Lora', 'Noto Serif JP', serif"
};
const STORAGE_KEY = 'sp.theme';
const FAV_KEY = 'sp.theme.favorites';
const DEFAULT_THEME = 'dark-1';

function getFavoriteThemes() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch { return []; }
}
function toggleFavorite(id) {
  let favs = getFavoriteThemes();
  if (favs.includes(id)) favs = favs.filter(x => x !== id);
  else favs.unshift(id);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

// そのテーマのCSS変数値を読んで返す（選択中テーマに依存しない独立取得）
function getThemeVars(id) {
  const el = document.createElement('div');
  el.setAttribute('data-preview-theme', id);
  el.style.cssText = 'position:fixed;pointer-events:none;opacity:0;top:-999px;';
  document.body.appendChild(el);
  const s = getComputedStyle(el);
  const get = (p) => s.getPropertyValue(p).trim();
  const vars = {
    bg: get('--bg'), bg2: get('--bg2'), sidebar: get('--sidebar'),
    card: get('--card'), border: get('--border'), border2: get('--border2'),
    text: get('--text'), muted: get('--muted'), muted2: get('--muted2'),
    primary: get('--primary'), accent: get('--accent'),
    radius: get('--radius'), shadow: get('--shadow'),
    glassBlur: get('--glass-blur'), btnText: get('--btn-primary-text'),
    activeBar: get('--active-border') || get('--primary'),
  };
  document.body.removeChild(el);
  return vars;
}

// メッシュ系テーマのプレビュー背景
const MESH_PREVIEW_BG = {
  'dark-9':  `radial-gradient(at 15% 20%, #1e3a8a 0%, transparent 50%), radial-gradient(at 80% 30%, #581c87 0%, transparent 55%), radial-gradient(at 30% 70%, #065f46 0%, transparent 45%), #0a0a18`,
  'light-10':`radial-gradient(at 15% 20%, #fce7f3 0%, transparent 50%), radial-gradient(at 80% 25%, #dbeafe 0%, transparent 55%), radial-gradient(at 30% 75%, #dcfce7 0%, transparent 50%), #f0f4ff`,
  'dark-12': `radial-gradient(at 15% 15%, #ff9adf55 0%, transparent 45%), radial-gradient(at 85% 20%, #6ec5ff55 0%, transparent 50%), radial-gradient(at 40% 80%, #c8a8ff55 0%, transparent 45%), #0e0e1e`,
  'dark-13': `radial-gradient(at 15% 15%, #ffadd055 0%, transparent 45%), radial-gradient(at 85% 20%, #ffc88a55 0%, transparent 50%), radial-gradient(at 40% 80%, #ff9a8d55 0%, transparent 45%), #1a0a14`,
  'dark-11': `radial-gradient(at 20% 80%, #ff008030 0%, transparent 50%), radial-gradient(at 80% 20%, #00f0ff30 0%, transparent 50%), #050006`,
  'dark-3':  `linear-gradient(180deg, #15082c 0%, #240e4a 60%, #4d1a6a 100%)`,
};

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(STORAGE_KEY, id);
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.themeId === id);
  });
}

function buildThemeCardHTML(t, currentId, favs = getFavoriteThemes()) {
  const v = getThemeVars(t.id);
  const isFav = favs.includes(t.id);
  const themeFont = THEME_FONTS[t.id] || 'Outfit, sans-serif';
  const inlineVars = makeInlineVars(v);
  const meshBg = MESH_PREVIEW_BG[t.id];
  const previewBg = meshBg || v.bg;
  const rNum = parseFloat(v.radius) || 8;
  const previewRadius = Math.round(rNum * 0.65) + 'px';
  const isActive = t.id === currentId;
  return `
    <button class="theme-card${isActive ? ' active' : ''}"
            data-theme-id="${t.id}"
            style="${inlineVars}">
      <div class="theme-card-preview" style="background:${previewBg};border-radius:${previewRadius};font-family:${themeFont};">
        <div class="preview-sidebar" style="background:${v.sidebar};border-right:1px solid ${v.border};">
          <div class="preview-logo" style="background:${v.accent};box-shadow:0 0 6px ${v.accent}66;"></div>
          <div class="preview-btn-primary" style="background:${v.primary};color:${v.btnText};border-radius:calc(${v.radius} * 0.45);">＋ NEW</div>
          <div class="preview-project active" style="background:${v.primary}22;border:1px solid ${v.activeBar || v.primary}55;border-radius:3px;height:9px;"></div>
          <div class="preview-project" style="background:${v.card};border:1px solid ${v.border};border-radius:3px;height:9px;"></div>
          <div class="preview-project" style="background:${v.card};border:1px solid ${v.border};border-radius:3px;height:9px;"></div>
        </div>
        <div class="preview-main" style="background:${v.bg2};">
          <div class="preview-tabs" style="border-bottom:1px solid ${v.border};">
            <div class="preview-tab active" style="color:${v.primary};background:${v.card};font-weight:800;">素材</div>
            <div class="preview-tab" style="color:${v.muted2};">3D</div>
            <div class="preview-tab" style="color:${v.muted2};">ドット</div>
          </div>
          <div class="preview-stats">
            <div class="preview-stat" style="background:${v.card};border:1px solid ${v.border};border-radius:calc(${v.radius} * 0.5);">
              <div class="preview-stat-num" style="color:${v.accent};">2.4k</div>
              <div class="preview-stat-label" style="color:${v.muted};">TOTAL</div>
            </div>
            <div class="preview-stat" style="background:${v.card};border:1px solid ${v.border};border-radius:calc(${v.radius} * 0.5);">
              <div class="preview-stat-num" style="color:${v.accent};">18</div>
              <div class="preview-stat-label" style="color:${v.muted};">TYPES</div>
            </div>
          </div>
          <div class="preview-btn-sample" style="background:${v.primary};color:${v.btnText};border-radius:calc(${v.radius} * 0.45);">適用</div>
        </div>
      </div>
      <div class="theme-card-name" style="color:${v.text};font-family:${themeFont};display:flex;align-items:center;gap:6px;justify-content:space-between;min-width:0;">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;">${t.name}</span>
        <span class="theme-fav-btn${isFav ? ' active' : ''}" data-fav-id="${t.id}" title="${isFav ? 'お気に入り解除' : 'お気に入り'}"
              style="color:${isFav ? v.accent : v.muted};">${isFav ? '★' : '☆'}</span>
      </div>
      <div class="theme-card-tags">
        ${t.tags.map(tag => `<span class="theme-tag" style="border-color:${v.border2};color:${v.muted2};">${tag}</span>`).join('')}
      </div>
      <div class="theme-card-desc" style="color:${v.muted};">${t.desc}</div>
    </button>`;
}



function makeInlineVars(v) {
  return [
    `--bg:${v.bg}`, `--bg2:${v.bg2}`, `--sidebar:${v.sidebar}`,
    `--card:${v.card}`, `--border:${v.border}`, `--border2:${v.border2}`,
    `--text:${v.text}`, `--muted:${v.muted}`, `--muted2:${v.muted2}`,
    `--primary:${v.primary}`, `--accent:${v.accent}`,
    `--radius:${v.radius}`, `--shadow:${v.shadow}`,
    `--glass-blur:${v.glassBlur}`, `--btn-primary-text:${v.btnText}`,
    `--active-border:${v.activeBar}`, `--active-bg:${v.activeBar}1a`,
    `--hover-bg:${v.primary}18`,
  ].join(';');
}

function renderThemes(filter = 'all') {
  const grid = document.getElementById('themes-grid');
  if (!grid) return;
  const current = localStorage.getItem(STORAGE_KEY) || 'dark-1';
  const list = filter === 'all' ? THEMES : THEMES.filter(t => t.kind === filter);

  // お気に入り優先で並び替え（元の順序は維持しつつ★だけ上に持ち上げる）
  const favs = getFavoriteThemes();
  const sorted = [...list].sort((a, b) => {
    const ai = favs.indexOf(a.id), bi = favs.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  grid.innerHTML = sorted.map(t => buildThemeCardHTML(t, current, favs)).join('');

  grid.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // ★ ボタンクリック時は applyTheme を発火しない
      if (e.target.classList.contains('theme-fav-btn')) {
        e.stopPropagation();
        toggleFavorite(card.dataset.themeId);
        renderThemes(document.querySelector('.theme-filter-bar .filter-pill.active')?.dataset.themeFilter || 'all');
        return;
      }
      applyTheme(card.dataset.themeId);
    });
  });
}

// テーマフィルタバーを生成
function setupThemeFilter() {
  const panel = document.getElementById('panel-themes');
  if (!panel || panel.querySelector('.theme-filter-bar')) return;
  const section = panel.querySelector('.settings-section');
  if (!section) return;

  const bar = document.createElement('div');
  bar.className = 'theme-filter-bar';
  bar.innerHTML = `
    <div class="filter-pills" style="margin-bottom:1rem">
      <button class="filter-pill active" data-theme-filter="all">すべて (26)</button>
      <button class="filter-pill" data-theme-filter="dark">🌙 Dark (13)</button>
      <button class="filter-pill" data-theme-filter="light">☀️ Light (13)</button>
      <button class="filter-pill" data-theme-filter="random" style="margin-left:auto">🎲 ランダム</button>
      <button class="theme-reset-btn" data-theme-reset>↺ デフォルトに戻す</button>
      <button class="font-toggle-btn" data-font-toggle title="テーマ固有フォントを無効化してOutfitに統一">🔤 デフォルトフォント</button>
    </div>
  `;
  section.insertBefore(bar, section.querySelector('.themes-grid'));

  bar.querySelectorAll('[data-theme-filter]').forEach(b => {
    b.addEventListener('click', () => {
      const f = b.dataset.themeFilter;
      if (f === 'random') {
        const pick = THEMES[Math.floor(Math.random() * THEMES.length)];
        applyTheme(pick.id);
        return;
      }
      bar.querySelectorAll('[data-theme-filter]').forEach(x =>
        x.classList.toggle('active', x === b));
      renderThemes(f);
    });
  });
  bar.querySelector('[data-theme-reset]')?.addEventListener('click', () => {
    applyTheme(DEFAULT_THEME);
    renderThemes(bar.querySelector('.filter-pill.active')?.dataset.themeFilter || 'all');
  });

  // フォントトグル
  const fontBtn = bar.querySelector('[data-font-toggle]');
  if (fontBtn) {
    const setFontMode = (isDefault) => {
      document.body.classList.toggle('fonts-default', isDefault);
      fontBtn.classList.toggle('active', isDefault);
      fontBtn.textContent = isDefault ? '✨ テーマ固有に戻す' : '🔤 デフォルトフォント';
      localStorage.setItem('sp.theme.fontsDefault', isDefault ? '1' : '0');
    };
    setFontMode(localStorage.getItem('sp.theme.fontsDefault') === '1');
    fontBtn.addEventListener('click', () => {
      setFontMode(!document.body.classList.contains('fonts-default'));
    });
  }
}

// 初期テーマ復元
const savedTheme = localStorage.getItem(STORAGE_KEY);
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
if (localStorage.getItem('sp.theme.fontsDefault') === '1') {
  document.body.classList.add('fonts-default');
}

// タブ切替で初回レンダリング
document.querySelector('[data-tab="themes"]')?.addEventListener('click', () => {
  setupThemeFilter();
  renderThemes('all');
});
