"""
透過処理に失敗したアイコンを検出して指定フォルダに退避する。
- 背景残り: 四隅のアルファ合計が閾値超え
- 被写体欠け: 不透明ピクセル数が画像面積の8%未満
"""
import sys, shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent
ICONS = ROOT / "public" / "icons"
ARCHIVE = Path("C:/Users/maita/OneDrive/デスクトップ/透過失敗")
ARCHIVE.mkdir(parents=True, exist_ok=True)

MIN_SUBJECT = 0.08   # 不透明ピクセルが画像面積比これ未満なら欠け
BBOX_FILL_THRESH = 0.78  # bbox内不透明率がこれ超なら矩形背景残り
LARGE_AREA = 0.25  # 大面積のみ bbox 判定対象

dry_run = "--apply" not in sys.argv

bad = []
for f in sorted(ICONS.rglob("*.png")):
    img = Image.open(f).convert("RGBA")
    w, h = img.size
    alpha = img.split()[-1]
    pixels = list(alpha.getdata())

    # 全体被写体比率
    opaque = sum(1 for p in pixels if p > 64)
    subject_ratio = opaque / (w*h)

    # bbox 充填率
    bbox = alpha.getbbox()
    bbox_fill = 0
    if bbox:
        bx1,by1,bx2,by2 = bbox
        bbox_area = max(1,(bx2-bx1)*(by2-by1))
        bbox_fill = opaque / bbox_area

    reason = None
    if subject_ratio < MIN_SUBJECT:
        reason = f"over-cut (subject={subject_ratio:.2%})"
    elif subject_ratio > LARGE_AREA and bbox_fill > BBOX_FILL_THRESH:
        reason = f"bg-leak (subject={subject_ratio:.0%}, bbox-fill={bbox_fill:.0%})"

    if reason:
        rel = f.relative_to(ICONS)
        bad.append((rel, reason))
        if not dry_run:
            theme, fname = str(rel).replace("\\","/").split("/", 1)
            dst = ARCHIVE / f"{theme}_{fname}"
            shutil.move(str(f), dst)

print(f"検出: {len(bad)} 枚 / 182")
for rel, reason in bad:
    print(f"  {rel}  [{reason}]")

if dry_run:
    print(f"\n(--apply で {ARCHIVE} に移動)")
else:
    print(f"\n→ {ARCHIVE} に移動済み")
