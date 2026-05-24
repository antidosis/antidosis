#!/usr/bin/env python3
"""Mechanically wrap simple API routes with withApiHandler."""

import pathlib
import re

BASE = pathlib.Path("src/app/api/v1")

def process_file(path: pathlib.Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "withApiHandler" in text:
        return False  # already wrapped

    # Only process files with a single handler and simple outer try/catch
    handlers = list(re.finditer(r"^export async function (\w+)\(", text, re.MULTILINE))
    if len(handlers) != 1:
        return False  # too complex

    func_name = handlers[0].group(1)
    func_start = handlers[0].start()

    # Check if there's an outer try block right after the function start
    func_body_start = text.find("{", func_start) + 1
    rest = text[func_body_start:].lstrip()
    if not rest.startswith("try {"):
        return False  # no outer try/catch

    # Find the matching catch block that returns 500
    # Simple heuristic: find "} catch" near the end before the final "}"
    catch_pattern = r"}\s*catch\s*\(\s*\w*\s*\)\s*\{[^}]*return\s+NextResponse\.json\(\s*\{\s*error:\s*['\"]Internal server error['\"][^}]*\},\s*\{\s*status:\s*500\s*\}\s*\)[^}]*\}"
    catch_match = re.search(catch_pattern, text)
    if not catch_match:
        return False

    # Get the inner body (between first try { and the catch block)
    try_open = text.find("try {", func_body_start)
    if try_open == -1:
        return False
    inner_start = try_open + len("try {")
    inner_end = catch_match.start()
    inner_body = text[inner_start:inner_end].strip()

    # Build the signature
    sig_match = re.search(r"export async function (\w+)\((.*?)\)", text[func_start:func_body_start], re.DOTALL)
    if not sig_match:
        return False
    sig = sig_match.group(2).strip()

    # Convert signature
    if "{ params }" in sig:
        new_sig = f"req: NextRequest, _ctx, {{ params }}: {{ params: {{ id: string }} }}"
    elif "req: NextRequest" in sig:
        new_sig = "req: NextRequest"
    else:
        new_sig = "req: NextRequest"

    # Build new content
    before = text[:func_start]
    after = text[catch_match.end():].lstrip()

    # Add import if missing
    if "withApiHandler" not in before:
        before = before.replace(
            'import { type NextRequest, NextResponse } from "next/server";',
            'import { type NextRequest, NextResponse } from "next/server";\n\nimport { withApiHandler } from "@/lib/api-handler";',
        )
        if "withApiHandler" not in before:
            before = before.replace(
                'import { NextResponse } from "next/server";',
                'import { NextResponse } from "next/server";\n\nimport { withApiHandler } from "@/lib/api-handler";',
            )

    new_handler = f'export const {func_name} = withApiHandler(async ({new_sig}) => {{\n  {inner_body}\n}});'

    new_text = before + new_handler + "\n" + after

    path.write_text(new_text, encoding="utf-8")
    print(f"  wrapped: {path}")
    return True


def main():
    count = 0
    for path in sorted(BASE.rglob("route.ts")):
        if process_file(path):
            count += 1
    print(f"\nWrapped {count} routes")


if __name__ == "__main__":
    main()
