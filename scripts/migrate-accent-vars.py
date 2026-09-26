#!/usr/bin/env python3
"""One-shot: quoted hex colors in inline-style data -> hex-valued CSS vars.

Replaces "#rrggbb" string literals in the listed files with "var(--x-rrggbb)"
and injects the corresponding --x- vars (dark original + tuned light variant)
into globals.css between the x-accent-vars markers. Hex-valued vars keep the
`${color}15` alpha-suffix pattern working after CSS substitution.
"""
import colorsys
import io
import re

FILES = [
    "src/app/_components/home-client.tsx",
    "src/components/layout/ticker-banner.tsx",
    "src/components/launch-countdown.tsx",
    "src/app/(app)/dashboard/_components/dashboard-header.tsx",
    "src/app/(app)/dashboard/_components/profile-checklist.tsx",
    "src/app/(app)/dashboard/_components/progress-ring.tsx",
    "src/app/(app)/dashboard/_components/profile-section.tsx",
    "src/app/(app)/demo/page.tsx",
    "src/app/(app)/demo/user-experience/_components/guide-bar.tsx",
    "src/app/(app)/demo/user-experience/_components/user-experience-demo-client.tsx",
    "src/app/(app)/demo/user-experience/_components/mock-data.ts",
    "src/app/(app)/demo/_components/terminal-demo-client.tsx",
    "src/app/how-it-works/_components/how-it-works-client.tsx",
    "src/lib/categories.ts",
]

# Left literal: brand constants, contract parchment, already-light values.
EXCLUDE = {
    "1877f2", "1da1f2", "0a66c2", "e4405f", "e0f2fe",
    "f5e6c8", "f0dfc0", "2c1810", "1a0f08", "d4b896", "e8d5b8",
    "8a7050", "e0c898", "b89a68", "f6f1e7", "ffffff",
}

# Neutrals/surfaces map to hand-tuned light palette values, not computed ones.
NEUTRAL_LIGHT = {
    "0a0806": "f6f1e7", "111111": "f6f1e7", "000000": "f6f1e7",
    "0f0c0a": "efe8d9", "1a1a1a": "efe8d9",
    "1a1714": "ffffff",
    "262626": "ddd2bd", "2a2420": "ddd2bd",
    "737373": "6e5f4b", "7a6b5a": "6e5f4b",
    "8f7f6e": "6f5e47", "a3a3a3": "6f5e47",
    "b8a078": "5b4a35", "e5e5e5": "4a3f30", "e8d5a3": "2e2318",
    "001520": "e0eef2", "001a25": "e0eef2", "0c4a6e": "e0eef2",
    "12001f": "f0e4fa", "0a0014": "f0e4fa", "4a1d6b": "f0e4fa",
    "001100": "e2f0e4", "003300": "e2f0e4",
}

def light_variant(hex6: str) -> str:
    """Hue-preserving darkening so neon accents keep contrast on paper."""
    r, g, b = (int(hex6[i : i + 2], 16) / 255 for i in (0, 2, 4))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l2 = max(0.22, min(l * 0.62, 0.45))
    s2 = s * 0.95
    r2, g2, b2 = colorsys.hls_to_rgb(h, l2, s2)
    return "".join(f"{round(c * 255):02x}" for c in (r2, g2, b2))

hex_re = re.compile(r'"#([0-9a-fA-F]{6})"')
found = {}  # hex -> set(files)

for path in FILES:
    with io.open(path, encoding="utf-8", newline="") as f:
        src = f.read()

    def repl(m):
        key = m.group(1).lower()
        if key in EXCLUDE:
            return m.group(0)
        found.setdefault(key, set()).add(path)
        return f'"var(--x-{key})"'

    out = hex_re.sub(repl, src)
    if out != src:
        with io.open(path, "w", encoding="utf-8", newline="") as f:
            f.write(out)

dark_lines = []
light_lines = []
for key in sorted(found):
    light = NEUTRAL_LIGHT.get(key) or light_variant(key)
    dark_lines.append(f"    --x-{key}: #{key};")
    light_lines.append(f"    --x-{key}: #{light};")

css_path = "src/app/globals.css"
with io.open(css_path, encoding="utf-8", newline="") as f:
    css = f.read()

css = css.replace(
    "    /* x-accent-vars:start */\n    /* x-accent-vars:end */",
    "    /* x-accent-vars:start */\n" + "\n".join(dark_lines) + "\n    /* x-accent-vars:end */",
)
css = css.replace(
    "    /* x-accent-vars-light:start */\n    /* x-accent-vars-light:end */",
    "    /* x-accent-vars-light:start */\n" + "\n".join(light_lines) + "\n    /* x-accent-vars-light:end */",
)

with io.open(css_path, "w", encoding="utf-8", newline="") as f:
    f.write(css)

print(f"converted {sum(len(v) for v in found.values())} literals, {len(found)} distinct vars")
for key in sorted(found):
    print(f"  --x-{key}: #{key} -> #{NEUTRAL_LIGHT.get(key) or light_variant(key)}")
