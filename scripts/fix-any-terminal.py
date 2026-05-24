#!/usr/bin/env python3
import re
import os

HANDLERS_DIR = "src/app/(app)/terminal/_components/terminal-handlers"

# Common replacements
REPLACEMENTS = [
    # catch (err: any) -> catch (err: unknown)
    (r'catch \((err|error): any\)', r'catch (\1: unknown)'),
    # Promise<any> -> Promise<unknown> (but not in generics like apiGet<T>)
    (r': Promise<any>([^a-zA-Z])', r': Promise<unknown>\1'),
    # (n: any) in callbacks for notifications/messages
    (r'\(n: any\)', r'(n: { readAt?: string | null; title: string; createdAt: string })'),
    # (u: any) for users
    (r'\(u: any\)', r'(u: { id: string; fullName: string | null })'),
    # (c: any) for channels/contracts
    (r'\(c: any\)', r'(c: { id: string; name: string; slug?: string })'),
    # (m: any) for messages
    (r'\(m: any\)', r'(m: { id: string; content: string; createdAt: string; sender?: { fullName: string | null } })'),
    # (s: any) for skills
    (r'\(s: any\)', r'(s: { id: string; name: string })'),
    # const data: any -> const data: unknown
    (r'const (\w+): any ', r'const \1: unknown '),
]

for filename in os.listdir(HANDLERS_DIR):
    if not filename.endswith('.ts'):
        continue
    path = os.path.join(HANDLERS_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")

print("Done!")
