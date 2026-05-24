#!/usr/bin/env python3
import subprocess, json
from collections import defaultdict

result = subprocess.run(
    ["npx", "eslint", "src/app/(app)/terminal/_components/terminal-handlers", "--format", "json"],
    capture_output=True, text=True, shell=True, encoding="utf-8", errors="replace"
)

try:
    data = json.loads(result.stdout)
except json.JSONDecodeError:
    print("Could not parse eslint output")
    exit(1)

files = defaultdict(list)
for item in data:
    for msg in item.get("messages", []):
        if msg.get("ruleId") == "@typescript-eslint/no-explicit-any":
            files[item["filePath"]].append(msg["line"])

for path, lines in sorted(files.items(), key=lambda x: -len(x[1])):
    short = path.split("terminal-handlers/")[-1]
    print(f"{len(lines):2} | {short}")
