"""
任意フォルダの PNG を rembg で透過化し、別フォルダに保存する。
使い方:
  python scripts/remove-bg-folder.py <src_dir> <dst_dir>
"""
import sys
from pathlib import Path
from rembg import remove, new_session

if len(sys.argv) < 3:
    print("usage: remove-bg-folder.py <src> <dst>")
    sys.exit(1)

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)

session = new_session("isnet-general-use")
files = sorted(src.glob("*.png"))
print(f"処理開始: {len(files)} 枚 -> {dst}")
for f in files:
    data = f.read_bytes()
    out = remove(data, session=session)
    (dst / f.name).write_bytes(out)
    print(f"  {f.name}")
print(f"完了: {len(files)} 枚")
