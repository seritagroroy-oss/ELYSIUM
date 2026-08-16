import re

file_path = 'c:/laragon/www/pontage/backend/modules/salaries.php'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

last_prepare = ""
last_prepare_line = 0
prepare_param_count = 0

for i, line in enumerate(lines):
    line = line.strip()
    
    # Match ->prepare("...") or ->prepare('...')
    m1 = re.search(r'->prepare\(\s*["\'](.*?)(["\']\s*\))', line)
    m2 = re.search(r'->prepare\(\s*["\'](.*?)["\']', line)
    m = m1 or m2
    if m:
        last_prepare = m.group(1)
        last_prepare_line = i + 1
        prepare_param_count = last_prepare.count('?')
        
    m_exec = re.search(r'->execute\(\[(.*?)\]\)', line)
    if m_exec:
        execute_args = m_exec.group(1).strip()
        execute_param_count = 0
        if execute_args:
            execute_param_count = execute_args.count(',') + 1
            
        if prepare_param_count != execute_param_count:
            print(f"Mismatch at line {i + 1} (prepare at line {last_prepare_line}):")
            print(f"Prepare ({prepare_param_count} params): {last_prepare}")
            print(f"Execute ({execute_param_count} params): {line}")
            print("-" * 60)
