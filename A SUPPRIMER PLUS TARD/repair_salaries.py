import re

input_file = 'c:/laragon/www/pontage/sauvegard/salaries.php'
output_file = 'c:/laragon/www/pontage/backend/modules/salaries.php'

with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

last_prepare = ""
prepare_param_count = 0

for i in range(len(lines)):
    line = lines[i]
    
    # Track the last prepare statement's parameter count
    m1 = re.search(r'->prepare\(\s*["\'](.*?)(["\']\s*\))', line)
    m2 = re.search(r'->prepare\(\s*["\'](.*?)["\']', line)
    m = m1 or m2
    if m:
        last_prepare = m.group(1)
        prepare_param_count = last_prepare.count('?')
        
    # Check execute calls
    m_exec = re.search(r'->execute\(\[(.*?)\]\)', line)
    if m_exec:
        execute_args = m_exec.group(1).strip()
        execute_param_count = 0
        if execute_args:
            execute_param_count = execute_args.count(',') + 1
            
        if prepare_param_count != execute_param_count:
            # We assume my patch added ', resolveCurrentCompanyIdSql()' at the end erroneously.
            # If execute count is exactly 1 greater than prepare count, and the last parameter is resolveCurrentCompanyIdSql(), we remove it.
            if execute_param_count == prepare_param_count + 1 and 'resolveCurrentCompanyIdSql()' in execute_args:
                # Remove the last parameter
                args_list = execute_args.split(',')
                # Drop the last one
                new_args = ','.join(args_list[:-1]).strip()
                lines[i] = re.sub(r'->execute\(\[(.*?)\]\)', f'->execute([{new_args}])', line)
                print(f"Fixed mismatch at line {i+1}: {new_args}")
            elif execute_param_count == prepare_param_count - 1 and 'resolveCurrentCompanyIdSql()' not in execute_args:
                # We missed adding resolveCurrentCompanyIdSql()!
                new_args = execute_args + ", resolveCurrentCompanyIdSql()" if execute_args else "resolveCurrentCompanyIdSql()"
                lines[i] = re.sub(r'->execute\(\[(.*?)\]\)', f'->execute([{new_args}])', line)
                print(f"Fixed missing param at line {i+1}: {new_args}")
            else:
                print(f"WARNING: Unhandled mismatch at line {i+1}. Prepare: {prepare_param_count}, Execute: {execute_param_count}. Line: {line.strip()}")

with open(output_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("Repair complete.")
