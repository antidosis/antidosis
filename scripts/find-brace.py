with open('src/app/(app)/terminal/_components/terminal-client.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines, 1):
    stripped = line.strip()
    if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
        continue
    in_string = False
    string_char = None
    for j, ch in enumerate(line):
        if not in_string and ch in '"\'':
            in_string = True
            string_char = ch
        elif in_string and ch == string_char and (j == 0 or line[j-1] != '\\'):
            in_string = False
            string_char = None
        elif not in_string:
            if ch == '{':
                balance += 1
            elif ch == '}':
                balance -= 1
    if balance < 0:
        print(f'Negative balance at line {i}: {balance}')
        print(repr(line))
        break
    if balance == 1 and i > 100:
        print(f'Balance dropped to 1 at line {i}')
else:
    print(f'Final balance: {balance}')
