"""
透過 PNG の余白をクロップして被写体を拡大する（in-place）。
- アルファ > 16 のピクセルからバウンディングボックスを取得
- 少しだけ余白を残してクロップ
- 元のキャンバスサイズにリサイズ
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
ICONS = ROOT / "public" / "icons"

PADDING_RATIO = 0.06  # 周囲に残す余白率（被写体辺長比）
ALPHA_THRESH = 16

def process(p: Path):
    img = Image.open(p).convert("RGBA")
    w, h = img.size
    alpha = img.split()[-1]
    # 閾値マスクから bbox 取得
    bbox = alpha.point(lambda a: 255 if a > ALPHA_THRESH else 0).getbbox()
    if not bbox:
        return False
    bx1, by1, bx2, by2 = bbox
    bw, bh = bx2-bx1, by2-by1
    pad = int(max(bw, bh) * PADDING_RATIO)
    cx1 = max(0, bx1 - pad)
    cy1 = max(0, by1 - pad)
    cx2 = min(w, bx2 + pad)
    cy2 = min(h, by2 + pad)
    # 正方形を保つため拡張
    cw, ch = cx2-cx1, cy2-cy1
    side = max(cw, ch)
    cx = (cx1+cx2)//2
    cy = (cy1+cy2)//2
    sx1 = max(0, cx - side//2)
    sy1 = max(0, cy - side//2)
    sx2 = min(w, sx1 + side)
    sy2 = min(h, sy1 + side)
    cropped = img.crop((sx1, sy1, sx2, sy2))
    resized = cropped.resize((w, h), Image.LANCZOS)
    resized.save(p)
    return True

files = sorted(ICONS.rglob("*.png"))
ok = 0
for f in files:
    try:
        if process(f):
            ok += 1
    except Exception as e:
        print(f"  skip {f.name}: {e}")
print(f"完了: {ok}/{len(files)}")
