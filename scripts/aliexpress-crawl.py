"""Crawl AliExpress search pages and shortlist MeshCore-compatible hardware.

Usage:  python scripts/aliexpress-crawl.py "query one" "query two" ...
Prints a deduped table: title, AUD price, item URL.
"""

import json
import re
import subprocess
import sys
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

PATTERN = re.compile(
    r'\{"redirectedId":"(?P<id>\d{10,})".*?"displayTitle":"(?P<title>.*?)".*?'
    r'"minPrice":(?P<price>[\d.]+)', re.S)


def search(query: str) -> list[dict]:
    url = ("https://www.aliexpress.com/wholesale?SearchText="
           + urllib.parse.quote_plus(query) + "&currency=AUD")
    html = subprocess.run(
        ["curl", "-sL", "-A", UA, url], capture_output=True, text=True,
        encoding="utf-8", errors="ignore",
    ).stdout
    seen, out = set(), []
    for m in PATTERN.finditer(html):
        pid = m.group("id")
        if pid in seen:
            continue
        seen.add(pid)
        title = m.group("title").encode().decode("unicode_escape", errors="ignore")
        out.append({
            "id": pid,
            "title": title,
            "price": float(m.group("price")),
            "url": f"https://www.aliexpress.com/item/{pid}.html",
        })
    return out


def main() -> None:
    for query in sys.argv[1:]:
        print(f"\n=== {query} ===")
        results = search(query)
        if not results:
            print("  (no results parsed — page may have been bot-guarded)")
        for item in results[:12]:
            print(f"  AU${item['price']:>7.2f}  {item['title'][:90]}")
            print(f"             {item['url']}")


if __name__ == "__main__":
    main()
