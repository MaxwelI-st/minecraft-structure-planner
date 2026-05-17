/**
 * dotart-pdf.js — IKEA 風タイル分割 PDF 印刷
 *
 * ドット絵を tile×tile のブロックに分割し、1 タイル = 1 ページの PDF を生成する。
 * 各ページに: タイル番号 / ミニマップ / 拡大画像 / そのタイルの必要素材表。
 */

import { jsPDF } from 'jspdf';

/**
 * @param {DotArtEditor} editor - 描画済み DotArtEditor インスタンス
 * @param {Array} palette       - DOT_PALETTE
 * @param {number} tileSize     - 1 タイル辺長（セル単位）
 * @param {object} langData     - 表示用 ja マップ
 */
export async function exportDotArtTiledPDF(editor, palette, tileSize, langData = {}) {
  const grid = editor.grid;
  const gridH = grid.length;
  const gridW = grid[0]?.length || 0;
  if (gridW === 0 || gridH === 0) throw new Error('grid が空です');

  // パレット ID → { name, color } の辞書
  const palMap = new Map(palette.map(p => [p.id, p]));

  // タイル分割
  const tilesX = Math.ceil(gridW / tileSize);
  const tilesY = Math.ceil(gridH / tileSize);
  const totalTiles = tilesX * tilesY;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 全体ミニマップ Canvas を 1 度だけ作る
  const fullCanvas = _renderGridCanvas(grid, palMap, 4);

  // タイル毎にページ
  let firstPage = true;
  let tileNo = 0;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      tileNo++;
      if (!firstPage) doc.addPage();
      firstPage = false;

      // ── ヘッダ
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      const label = _tileLabel(tx, ty);
      doc.text(`Tile ${label}  (${tileNo} / ${totalTiles})`, 12, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Block ${tx * tileSize + 1}-${Math.min((tx + 1) * tileSize, gridW)} × ${ty * tileSize + 1}-${Math.min((ty + 1) * tileSize, gridH)}`, 12, 24);
      doc.setTextColor(0);

      // ── ミニマップ (右上)
      const miniSize = 40;
      const miniX = W - miniSize - 12;
      const miniY = 10;
      doc.addImage(fullCanvas.toDataURL('image/png'), 'PNG', miniX, miniY, miniSize, miniSize * gridH / gridW);
      // ハイライト枠
      const cellW = miniSize / gridW;
      const cellH = (miniSize * gridH / gridW) / gridH;
      doc.setDrawColor(220, 30, 30);
      doc.setLineWidth(0.6);
      doc.rect(
        miniX + tx * tileSize * cellW,
        miniY + ty * tileSize * cellH,
        tileSize * cellW,
        tileSize * cellH
      );
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);

      // ── タイル拡大画像
      const x0 = tx * tileSize, y0 = ty * tileSize;
      const x1 = Math.min(x0 + tileSize, gridW), y1 = Math.min(y0 + tileSize, gridH);
      const tileCanvas = _renderGridCanvas(grid, palMap, 20, { x0, y0, x1, y1, withCoords: true });
      const maxW = W - 24;
      const maxH = 140;
      const tw = x1 - x0, th = y1 - y0;
      const scale = Math.min(maxW / (tw * 20), maxH / (th * 20));
      const drawW = tw * 20 * scale;
      const drawH = th * 20 * scale;
      doc.addImage(tileCanvas.toDataURL('image/png'), 'PNG', 12, 32, drawW, drawH);

      // ── タイル素材表
      const tally = new Map();
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const id = grid[y][x];
        if (!id) continue;
        tally.set(id, (tally.get(id) || 0) + 1);
      }
      const tallySorted = [...tally.entries()].sort((a,b) => b[1] - a[1]);

      const tableY = 32 + drawH + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`必要素材  (${tally.size} 種類)`, 12, tableY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let rowY = tableY + 6;
      const colW = (W - 24) / 2;
      let col = 0;
      for (const [id, cnt] of tallySorted) {
        const p = palMap.get(id);
        const name = langData[id] || p?.name || id.replace('minecraft:', '');
        const cx = 12 + col * colW;
        // カラーチップ
        if (p?.color) {
          doc.setFillColor(parseInt(p.color.slice(1,3),16), parseInt(p.color.slice(3,5),16), parseInt(p.color.slice(5,7),16));
          doc.rect(cx, rowY - 3, 4, 4, 'F');
        }
        doc.text(`${name}`, cx + 6, rowY);
        doc.text(`× ${cnt}`, cx + colW - 18, rowY, { align: 'left' });
        if (col === 1) { rowY += 5; col = 0; } else { col = 1; }
        if (rowY > H - 12) break;
      }

      // フッター
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`Structure Planner — ドット絵タイル印刷`, 12, H - 6);
      doc.text(`${tileNo} / ${totalTiles}`, W - 12, H - 6, { align: 'right' });
      doc.setTextColor(0);
    }
  }

  doc.save(`dotart-tiles-${gridW}x${gridH}-tile${tileSize}.pdf`);
}

function _tileLabel(tx, ty) {
  // A1, A2, B1 ... タイル番号
  const letter = String.fromCharCode(65 + ty); // ty=0 → A
  return `${letter}${tx + 1}`;
}

function _renderGridCanvas(grid, palMap, cellSize, opts = {}) {
  const x0 = opts.x0 ?? 0;
  const y0 = opts.y0 ?? 0;
  const x1 = opts.x1 ?? (grid[0]?.length || 0);
  const y1 = opts.y1 ?? grid.length;
  const w = x1 - x0;
  const h = y1 - y0;

  const canvas = document.createElement('canvas');
  canvas.width = w * cellSize;
  canvas.height = h * cellSize;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // セル描画
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const id = grid[y]?.[x];
      if (!id) continue;
      const p = palMap.get(id);
      ctx.fillStyle = p?.color || '#888';
      ctx.fillRect((x - x0) * cellSize, (y - y0) * cellSize, cellSize, cellSize);
    }
  }

  // グリッド線（拡大時のみ）
  if (cellSize >= 8) {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= w; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize + 0.5, 0);
      ctx.lineTo(i * cellSize + 0.5, h * cellSize);
      ctx.stroke();
    }
    for (let j = 0; j <= h; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellSize + 0.5);
      ctx.lineTo(w * cellSize, j * cellSize + 0.5);
      ctx.stroke();
    }
  }

  // 座標ラベル（拡大時のみ）
  if (opts.withCoords && cellSize >= 16) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = `${Math.floor(cellSize * 0.35)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < w; i++) {
      ctx.fillText(String(x0 + i + 1), i * cellSize + cellSize / 2, 1);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let j = 0; j < h; j++) {
      ctx.fillText(String(y0 + j + 1), 2, j * cellSize + cellSize / 2);
    }
  }

  return canvas;
}
