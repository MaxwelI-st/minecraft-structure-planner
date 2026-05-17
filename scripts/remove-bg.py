"""
public/icons/ 配下の PNG を rembg で透過化する。
使い方:
  python scripts/remove-bg.py            # 全画像を in-place 処理
  python scripts/remove-bg.py --test     # dark-1/tab-materials.png 1枚だけテスト出力
"""
import sys
from pathlib import Path
from rembg import remove, new_session

ROOT = Path(__file__).parent.parent
ICONS = ROOT / "public" / "icons"

# isnet-general-use はピクセルアート系でも輪郭がきれい
session = new_session("isnet-general-use")

def process(src: Path, dst: Path):
    data = src.read_bytes()
    out = remove(data, session=session)
    dst.write_bytes(out)
    print(f"  {src.relative_to(ROOT)}")

if "--test" in sys.argv:
    src = ICONS / "dark-1" / "tab-materials.png"
    dst = ROOT / "test-rembg-output.png"
    process(src, dst)
    print(f"\n→ {dst}")
else:
    files = sorted(ICONS.rglob("*.png"))
    print(f"処理開始: {len(files)} 枚")
    for f in files:
        process(f, f)
    print(f"完了: {len(files)} 枚")
