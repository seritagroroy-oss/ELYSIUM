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
            if not stack:
                print(f"Unmatched }} at line {i + 1}, col {j + 1}")
            else:
                stack.pop()
    
    if "case 'add_agent':" in line:
        print(f"Reached case 'add_agent' at line {i + 1}. Current stack depth: {len(stack)}")
        if stack:
            print("Open braces:")
            for s in stack:
                print(f"  Line {s[0]}, Col {s[1]}: {lines[s[0]-1].strip()}")
        break

print(f"Final stack depth: {len(stack)}")
