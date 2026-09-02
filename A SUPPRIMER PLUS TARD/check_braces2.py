import sys

filepath = r"C:\laragon\www\pontage\backend\modules\sites_v2.php"

with open(filepath, 'r', encoding='utf8', errors='ignore') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for j, char in enumerate(line):
        if char == '{':
            stack.append((i + 1, j + 1))
        elif char == '}':
            if stack:
                stack.pop()
                if len(stack) == 0 and i + 1 > 33:
                    print(f"Stack dropped to 0 at line {i + 1}, col {j + 1}")
            else:
                pass
