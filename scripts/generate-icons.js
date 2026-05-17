/**
 * MC Planner — テーマアイコン一括生成スクリプト
 * モデル: gemini-3.1-flash-image-preview (Nano Banana 2)
 *
 * 使い方:
 *   GEMINI_API_KEY=your_key node scripts/generate-icons.js
 *   GEMINI_API_KEY=your_key node scripts/generate-icons.js --theme light-3
 *   GEMINI_API_KEY=your_key node scripts/generate-icons.js --icon logo
 *   GEMINI_API_KEY=your_key node scripts/generate-icons.js --skip-existing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// .env ファイルから API キーを読み込む
const envPath = path.join(ROOT, '.env');
try {
  const envText = await fs.readFile(envPath, 'utf-8');
  for (const line of envText.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch { /* .env がない場合は環境変数をそのまま使う */ }

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
const OUTPUT_BASE = path.join(ROOT, 'public', 'icons');
const DELAY_MS = 2500; // レートリミット対策

// ── CLIオプション解析 ────────────────────────────
const args = process.argv.slice(2);
const filterTheme = args.includes('--theme') ? args[args.indexOf('--theme') + 1] : null;
const filterIcon  = args.includes('--icon')  ? args[args.indexOf('--icon')  + 1] : null;
const skipExisting = args.includes('--skip-existing');

// ── テーマ定義 ───────────────────────────────────
const THEMES = [
  // ── Dark themes ─────────────────────────────────
  {
    id: 'dark-1',
    name: 'Default Dark',
    primary: '#4ade80',
    bg: '#070c14',
    card: '#101a2c',
    text: '#e2e8f0',
    accent: '#f59e0b',
    styleNote: 'dark slate night palette, deep navy background, fresh emerald green primary, soft amber accent, modern minimal dark UI, subtle glassmorphism',
    buildingNote: 'modern dark stone cottage at night, glowing green windows, small amber lantern beside it',
  },
  {
    id: 'dark-2',
    name: 'RTX Neon Glass',
    primary: '#22c55e',
    bg: '#050505',
    card: '#0f1912',
    text: '#f0fdf4',
    accent: '#4ade80',
    styleNote: 'RTX neon glass aesthetic, pitch black background, glowing emerald neon green, ray-traced glass reflections, sci-fi cyberpunk feel',
    buildingNote: 'futuristic glass structure with glowing neon green edges, raytraced reflections on pitch black floor',
  },
  {
    id: 'dark-3',
    name: 'Anemo Wanderer',
    primary: '#ff2e9a',
    bg: '#15082c',
    card: '#240e4a',
    text: '#f8e9ff',
    accent: '#00d9ff',
    styleNote: 'magical anime fantasy aesthetic, deep purple-violet background, hot pink magenta primary, cyan electric accent, ethereal glow, Genshin-inspired',
    buildingNote: 'mystical floating purple temple with glowing cyan abstract crystal patterns (no runes, no symbols), hot pink crystals around it',
  },
  {
    id: 'dark-4',
    name: 'Stim Rush',
    primary: '#c084fc',
    bg: '#0a0a0a',
    card: '#1a1a1a',
    text: '#fafafa',
    accent: '#a3e635',
    styleNote: 'high-contrast cyberpunk stim aesthetic, jet black background, vivid purple primary, electric lime green accent, hard edges, neon glow outlines',
    buildingNote: 'sharp angular dark tower with purple neon strips and lime green warning markings',
  },
  {
    id: 'dark-5',
    name: 'Obsidian Architect',
    primary: '#cbd5e1',
    bg: '#0a0a0a',
    card: '#111111',
    text: '#f5f5f5',
    accent: '#e5e7eb',
    styleNote: 'monochrome obsidian neumorphism, pure black background, soft silver-gray primary, no color hues, refined architectural minimalism, soft shadows',
    buildingNote: 'sleek obsidian black monolith tower with soft silver gray panels, minimalist geometric',
  },
  {
    id: 'dark-6',
    name: 'Midnight Espresso',
    primary: '#fb923c',
    bg: '#1c0e07',
    card: '#3a221a',
    text: '#fef3e7',
    accent: '#fbbf24',
    styleNote: 'midnight espresso cafe aesthetic, dark coffee brown background, warm orange primary, golden amber accent, cozy late-night warmth, vintage leather feel',
    buildingNote: 'dark wooden coffee shop at night with warm orange window light and golden lantern glow',
  },
  {
    id: 'dark-7',
    name: 'Deep Ocean',
    primary: '#6b8e5a',
    bg: '#0a1810',
    card: '#142a1c',
    text: '#f0ead0',
    accent: '#c9a23f',
    styleNote: 'tatami tea ceremony aesthetic, deep forest green background, muted sage olive primary, antique gold accent, traditional Japanese zen, weathered washi paper',
    buildingNote: 'traditional Japanese forest tea hut in deep green woods, with golden tatami glow inside',
  },
  {
    id: 'dark-8',
    name: 'Retro Terminal',
    primary: '#00ffd1',
    bg: '#000000',
    card: '#0a0a0a',
    text: '#ffffff',
    accent: '#ff00aa',
    styleNote: 'retro CRT terminal aesthetic, pure black background, glowing cyan green primary, hot pink magenta accent, scanlines, 80s pixel art arcade vibe',
    buildingNote: 'old CRT computer monitor with pixel art Minecraft cottage glowing on screen, 80s arcade style',
  },
  {
    id: 'dark-9',
    name: 'Aurora Glass',
    primary: '#c084fc',
    bg: '#0a0a18',
    card: '#141430',
    text: '#f5f5ff',
    accent: '#f0abfc',
    styleNote: 'aurora borealis glassmorphism, midnight navy background, soft purple-violet primary, pink-magenta accent, frosted glass with rainbow gradients',
    buildingNote: 'translucent glass cottage with aurora light rays in green-purple-pink dancing overhead',
  },
  {
    id: 'dark-10',
    name: 'Brutalist Slate',
    primary: '#4ade80',
    bg: '#16181d',
    card: '#20242c',
    text: '#f0f2f5',
    accent: '#4ade80',
    styleNote: 'brutalist dark slate UI, charcoal gray background, fresh green primary accent, flat sharp edges, IDE-inspired minimal, no glow',
    buildingNote: 'industrial concrete slate building with bright green door, sharp geometric brutalist design',
  },
  {
    id: 'dark-11',
    name: 'Cyberpunk Tokyo',
    primary: '#00f0ff',
    bg: '#050006',
    card: '#140523',
    text: '#e8f8ff',
    accent: '#ff0080',
    styleNote: 'cyberpunk Tokyo neon aesthetic, near-black violet background, electric cyan primary, hot neon pink accent, dense scanlines, Blade Runner rain feel',
    buildingNote: 'cyberpunk Tokyo alley shop with cyan and hot pink neon-lit geometric panels and abstract glowing shapes in the rain, wet reflective ground (blank signage, no characters)',
  },
  {
    id: 'dark-12',
    name: 'Holographic',
    primary: '#c8a8ff',
    bg: '#0e0e1e',
    card: '#1a1a2e',
    text: '#f0eaff',
    accent: '#ff9adf',
    styleNote: 'holographic pearl iridescent aesthetic, dark midnight background, lavender-purple primary, pink-magenta accent, multi-color iridescent mesh gradients, metallic future feel',
    buildingNote: 'iridescent holographic crystal pavilion with pearl-shimmer surfaces reflecting pink purple cyan',
  },
  {
    id: 'dark-13',
    name: 'Sunset Mirage',
    primary: '#ff9a8d',
    bg: '#1a0a14',
    card: '#2a1020',
    text: '#fff0e8',
    accent: '#ffc8a0',
    styleNote: 'sunset mirage aesthetic, deep wine-purple background, coral pink primary, peach apricot accent, warm dreamy gradients, golden hour glow',
    buildingNote: 'desert oasis cottage at sunset, coral pink walls glowing in golden hour, peach sky behind',
  },
  // ── Light themes ────────────────────────────────
  {
    id: 'light-1',
    name: 'Lavender Mist',
    primary: '#a878d8',
    bg: '#ede0f8',
    card: '#faf5ff',
    text: '#5a3878',
    accent: '#c090e0',
    styleNote: 'lavender and soft purple tones, pastel purple palette, dreamy misty atmosphere',
    buildingNote: 'purple-tinted stone cottage with lavender flowers around it',
  },
  {
    id: 'light-2',
    name: 'Frosted Crystal',
    primary: '#7aaae8',
    bg: '#dce8f8',
    card: '#f6fcff',
    text: '#2a4070',
    accent: '#6090d8',
    styleNote: 'icy blue and crystal tones, frosted glass aesthetic, cool cobalt palette, slight translucent sheen',
    buildingNote: 'ice-blue glass cottage with crystalline walls',
  },
  {
    id: 'light-3',
    name: 'Sakura Spring',
    primary: '#e890c0',
    bg: '#fadae8',
    card: '#fff6fb',
    text: '#7a3058',
    accent: '#e070a8',
    styleNote: 'cherry blossom pink, sakura petals, soft rose gold accents, springtime Japanese aesthetic',
    buildingNote: 'cherry wood cottage with two sakura trees on each side, pink petals falling',
  },
  {
    id: 'light-4',
    name: 'Blueprint Paper',
    primary: '#2563eb',
    bg: '#eeead8',
    card: '#fffef8',
    text: '#000000',
    accent: '#dc2626',
    styleNote: 'blueprint technical drawing style, bold black outlines, primary colors only, brutalist flat design, graph paper texture',
    buildingNote: 'geometric flat house blueprint diagram, red accent details',
  },
  {
    id: 'light-5',
    name: 'Paper Sage',
    primary: '#84b068',
    bg: '#dce8d4',
    card: '#f4faf2',
    text: '#445840',
    accent: '#6a9858',
    styleNote: 'sage green and natural earth tones, washi paper texture feel, calm botanical aesthetic, muted forest greens',
    buildingNote: 'mossy stone cottage surrounded by ferns and sage bushes',
  },
  {
    id: 'light-6',
    name: 'Mint Lab',
    primary: '#50c8b8',
    bg: '#caeeda',
    card: '#f2fdf9',
    text: '#2a6058',
    accent: '#38b8a8',
    styleNote: 'mint green and teal, clean laboratory aesthetic, fresh and crisp, slightly clinical but cute',
    buildingNote: 'clean white and mint-colored modern block structure',
  },
  {
    id: 'light-7',
    name: 'Latte Cafe',
    primary: '#d89050',
    bg: '#f0e2b4',
    card: '#fef9ee',
    text: '#6a4018',
    accent: '#c87838',
    styleNote: 'warm latte caramel tones, cozy cafe aesthetic, creamy beige and warm brown, autumn warmth',
    buildingNote: 'cozy wooden cafe cottage with warm lantern light, autumn leaves',
  },
  {
    id: 'light-8',
    name: 'Coral Bloom',
    primary: '#ec9080',
    bg: '#fac8b8',
    card: '#fff5f2',
    text: '#7a2c20',
    accent: '#e07060',
    styleNote: 'coral and salmon pink tones, warm tropical bloom, soft terracotta accents, summer floral aesthetic',
    buildingNote: 'terracotta cottage with coral flowers and tropical plants',
  },
  {
    id: 'light-9',
    name: 'Brutalist Mono',
    primary: '#333333',
    bg: '#d8d8d8',
    card: '#f8f8f8',
    text: '#000000',
    accent: '#000000',
    styleNote: 'black and white only, brutalist geometric style, bold thick outlines, no gradients, raw concrete aesthetic',
    buildingNote: 'raw concrete brutalist block tower, strictly geometric',
  },
  {
    id: 'light-10',
    name: 'Aurora Bright',
    primary: '#8b5cf6',
    bg: '#f0f4ff',
    card: '#ffffff',
    text: '#1e1b4b',
    accent: '#7c3aed',
    styleNote: 'aurora borealis inspired, violet and indigo gradient glow, glassy translucent quality, northern lights pastel',
    buildingNote: 'glowing violet crystal tower with aurora light rays above it',
  },
  {
    id: 'light-11',
    name: 'Vintage Newspaper',
    primary: '#1a1a1a',
    bg: '#f4ecd8',
    card: '#fcf5e2',
    text: '#2a1f15',
    accent: '#b8262a',
    styleNote: 'vintage newspaper sepia tone, aged yellowed paper texture, bold black ink typography, red marker accent, 1920s print aesthetic, brutalist flat borders',
    buildingNote: 'old stone printing press building with antique blank paper sheets stacked outside, decorative red accent borders, vintage ink jars (no text on papers)',
  },
  {
    id: 'light-12',
    name: 'Bento Box',
    primary: '#c8442a',
    bg: '#f2ebd9',
    card: '#faf3df',
    text: '#2a2018',
    accent: '#d4a02a',
    styleNote: 'Japanese wabi-sabi aesthetic, warm cream and warm parchment, vermilion red accent, golden yellow highlight, traditional Japanese minimalism, ink brush calligraphy feel',
    buildingNote: 'traditional Japanese wooden tea house with sliding shoji screens, vermilion torii gate nearby, maple tree with golden leaves',
  },
  {
    id: 'light-13',
    name: 'Hydrangea',
    primary: '#7a8ad8',
    bg: '#ecedff',
    card: '#fafbff',
    text: '#2a3060',
    accent: '#c890c0',
    styleNote: 'hydrangea flower soft blue-purple tones, frosted glass glassy aesthetic, lavender and periwinkle pastel palette, delicate translucent quality, rainy season Japanese garden mood',
    buildingNote: 'glass greenhouse cottage surrounded by blooming hydrangea bushes in blue-purple hues, soft misty rain atmosphere',
  },
];

// ── アイコン定義 ─────────────────────────────────
const ICONS = [
  {
    id: 'logo',
    size: 512,
    subject: (t) =>
      `A small cute ${t.buildingNote}. Isometric pixel art style, Minecraft-inspired, centered composition.`,
    suffix: 'Minecraft isometric pixel art app logo icon, centered, no text, no letters.',
  },
  {
    id: 'tab-materials',
    size: 256,
    subject: () => 'A Minecraft-style LARGE DOUBLE CHEST (2 blocks wide, rectangular, twice as long as deep — a 2x1 horizontal chest, NOT a single cube chest). Isometric view from the FRONT-RIGHT angle: the long front face points toward the camera and slightly to the right, the right short side is partially visible. Lid is open and tilted backward by about 25 degrees, HINGED AT THE BACK EDGE — the back edge of the lid MUST stay physically touching/attached to the back-top edge of the chest body (no floating gap between lid and box, the hinge line is continuous). The lid is a FLAT RECTANGULAR PLANK (same length and width as the chest top), lifted from the front edge so its underside is visible. The lid MUST remain a clean flat rectangle — NOT a triangle, NOT a wedge, NOT a pyramid shape. Show a small visible hinge or pixel-detail where the lid meets the back of the chest body. A single rectangular latch/clasp sits centered on the front face. Pixelated Minecraft block style with clear pixel detail on the wood/material texture and metal corner reinforcements at each corner.',
    suffix: 'Large double chest inventory icon, lid hinged at back and tilted open backward, lid is a flat rectangular plank not a triangle, viewed from front-right, isometric pixel art, Minecraft style, centered, one front latch only.',
  },
  {
    id: 'tab-3d',
    size: 256,
    subject: () => 'Three Minecraft blocks stacked in a simple isometric tower, pixel art style.',
    suffix: '3D viewer icon, isometric pixel art, Minecraft block tower, centered.',
  },
  {
    id: 'tab-dotart',
    size: 256,
    subject: () => 'A small art palette with a paintbrush, pixel art style, flat isometric view.',
    suffix: 'Dot art / pixel art editor icon, centered.',
  },
  {
    id: 'tab-themes',
    size: 256,
    subject: () => 'A glowing Minecraft diamond gem with colorful sparkles around it, isometric pixel art.',
    suffix: 'Theme selector icon, colorful gem, centered.',
  },
  {
    id: 'tab-settings',
    size: 256,
    subject: () => 'A Minecraft crafting table viewed from slightly above, isometric pixel art style.',
    suffix: 'Settings/crafting icon, isometric pixel art, centered.',
  },
  {
    id: 'btn-download',
    size: 256,
    subject: () => 'A downward arrow with a small Minecraft chest underneath it, pixel art style.',
    suffix: 'Download icon, pixel art, simple and clear, centered.',
  },
];

// ── プロンプト生成 ────────────────────────────────
function buildPrompt(theme, icon) {
  const subject = icon.subject(theme);
  return [
    subject,
    `Color palette: primary ${theme.primary}, background ${theme.bg}, accent ${theme.accent}.`,
    `Art style: ${theme.styleNote}.`,
    'CRITICAL BACKGROUND RULE: the ENTIRE canvas/background MUST be pure solid white #FFFFFF — no dark backdrop, no colored backdrop, no rectangular plate behind the subject, no rounded square card, no app-icon-style frame, no border tile, no badge shape, no gradient panel, no glass card, no scene, no platform under the subject, no ground tile, no environment, no sky, no floor. The subject must be FLOATING on pure white with only a soft drop shadow under it. Do NOT render the icon as if it sits inside an app icon container — the subject itself IS the icon. Theme colors apply ONLY to the subject itself, NEVER to the background. If the theme calls for a dark mood, express that through the subject color, not by adding a dark backdrop.',
    'Soft drop shadow beneath the object.',
    'No border or frame around the icon.',
    'Pastel color tones, matte finish, clean edges.',
    // ── 文字制約（最重要・絶対）─────────────────────
    'STRICT RULE — NO WRITING SYSTEMS: absolutely no Japanese kanji, no katakana, no hiragana, no Chinese characters, no Hangul, no Cyrillic, no Arabic script, no runes, no glyphs, no calligraphy, no characters that resemble writing in any language. Any signs, screens, panels, posters, books, or labels in the scene MUST be completely blank or show only abstract geometric shapes (dots, stripes, simple icons). If text is truly unavoidable, use ONLY plain English Latin letters (A–Z, a–z), never any other script.',
    icon.suffix,
  ].join(' ');
}

// ── API 呼び出し（503 自動リトライ付き）────────────
async function generateImage(prompt, size, retries = 5) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (netErr) {
      // ネットワーク切断（503 が body なしで切れる場合など）
      if (attempt < retries) {
        const wait = attempt * 15000;
        process.stdout.write(`\n   ↳ 接続エラー (${netErr.message})、${wait/1000}s 後に再試行 [${attempt}/${retries}]... `);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw netErr;
    }

    if (res.status === 503 || res.status === 429) {
      const errText = await res.text().catch(() => '');
      if (attempt < retries) {
        const wait = attempt * 15000; // 15s, 30s, 45s, 60s ...
        process.stdout.write(`\n   ↳ HTTP ${res.status}（過負荷）、${wait/1000}s 後に再試行 [${attempt}/${retries}]... `);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imgPart) throw new Error('レスポンスに画像データがありません: ' + JSON.stringify(data).slice(0, 300));
    return Buffer.from(imgPart.inlineData.data, 'base64');
  }
}

// ── メイン ───────────────────────────────────────
async function main() {
  const themes = filterTheme ? THEMES.filter(t => t.id === filterTheme) : THEMES;
  const icons  = filterIcon  ? ICONS.filter(i => i.id === filterIcon)   : ICONS;

  if (!themes.length) { console.error(`テーマ "${filterTheme}" が見つかりません`); process.exit(1); }
  if (!icons.length)  { console.error(`アイコン "${filterIcon}" が見つかりません`); process.exit(1); }

  const total = themes.length * icons.length;
  let done = 0, skipped = 0, failed = 0;

  console.log(`\n🎨 MC Planner アイコン生成開始`);
  console.log(`   テーマ: ${themes.length} / アイコン: ${icons.length} / 合計: ${total} 枚\n`);

  for (const theme of themes) {
    const dir = path.join(OUTPUT_BASE, theme.id);
    await fs.mkdir(dir, { recursive: true });

    for (const icon of icons) {
      const filePath = path.join(dir, `${icon.id}.png`);
      const label = `${theme.id}/${icon.id}.png`;

      // スキップオプション
      if (skipExisting) {
        try {
          await fs.access(filePath);
          console.log(`⏭  Skip: ${label}`);
          skipped++;
          done++;
          continue;
        } catch { /* ファイルなし → 生成へ */ }
      }

      const prompt = buildPrompt(theme, icon);
      process.stdout.write(`⏳ [${done + 1}/${total}] ${label} ... `);

      try {
        const imgBuf = await generateImage(prompt, icon.size);
        await fs.writeFile(filePath, imgBuf);
        console.log(`✅`);
      } catch (err) {
        console.log(`❌ ${err.message}`);
        failed++;
      }

      done++;

      // 最後の1枚以外は待機
      if (done < total) await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n── 完了 ───────────────────────────────`);
  console.log(`   ✅ 成功: ${done - failed - skipped}`);
  if (skipped) console.log(`   ⏭  スキップ: ${skipped}`);
  if (failed)  console.log(`   ❌ 失敗: ${failed}`);
  console.log(`   📁 保存先: public/icons/`);
}

main().catch(err => { console.error(err); process.exit(1); });
