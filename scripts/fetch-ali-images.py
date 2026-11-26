"""Fetch gallery images for AliExpress items into public/images/store.

Usage:  python scripts/fetch-ali-images.py <itemId>:<slug> [<itemId>:<slug> ...]
Saves up to 4 images per item as <slug>-1.webp ... <slug>-4.webp.
"""

import re
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
OUT = Path("public/images/store")
MAX_IMAGES = 4


def curl(url: str, referer: str | None = None) -> bytes:
    cmd = ["curl", "-sL", "-A", UA]
    if referer:
        cmd += ["-e", referer]
    cmd.append(url)
    return subprocess.run(cmd, capture_output=True).stdout


def image_urls(item_id: str) -> list[str]:
    html = curl(f"https://www.aliexpress.com/item/{item_id}.html").decode("utf-8", errors="ignore")
    urls: list[str] = []
    m = re.search(r'"summImagePathList":\[(.*?)\]', html)
    if m:
        # Full-size form: strip the trailing _NNxNN suffix and fetch with referer
        urls += [u[: u.rfind("_")] if re.search(r"_\d+x\d+\.", u) else u
                 for u in re.findall(r'"(https://[^"]+)"', m.group(1))]
    m = re.search(r'"imagePathList":\[(.*?)\]', html)
    if m:
        urls += re.findall(r'"(https://[^"]+)"', m.group(1))
    seen, out = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def main() -> None:
    for spec in sys.argv[1:]:
        item_id, slug = spec.split(":", 1)
        saved = 0
        for url in image_urls(item_id):
            if saved >= MAX_IMAGES:
                break
            raw = curl(url, referer="https://www.aliexpress.com/")
            tmp = OUT / f".{slug}-tmp"
            tmp.write_bytes(raw)
            try:
                im = Image.open(tmp)
                im.load()
                if im.width < 400:  # thumbnail — skip
                    tmp.unlink()
                    continue
                im.convert("RGB").save(OUT / f"{slug}-{saved + 1}.webp", "WEBP", quality=90)
                print(f"{slug}-{saved + 1}.webp  {im.size}  from {url[:80]}")
                saved += 1
            except Exception as exc:  # noqa: BLE001 - skip undecodable payloads
                print(f"  skip ({exc}) {url[:80]}")
            finally:
                tmp.unlink(missing_ok=True)
            time.sleep(2)
        if saved == 0:
            print(f"!! {slug}: no usable images (item {item_id})")
        time.sleep(5)


if __name__ == "__main__":
    main()
