import re
with open(r"c:\laragon\www\pontage\backend\modules\salaries.php", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "prepare(" in line and "SELECT" in line:
        for j in range(i+1, min(i+10, len(lines))):
            if "execute(" in lines[j]:
                num_q = line.count("?")
                # Extract params from execute([ ... ])
                m = re.search(r"execute\(\[(.*?)\]\)", lines[j])
                if m:
                    params_str = m.group(1).strip()
                    if "array_values" in params_str or "array_merge" in params_str or not params_str:
                        continue
                    # Rough parameter count (split by comma, ignoring nested parentheses/brackets for now)
                    # For safety, just count commas not inside quotes or parentheses
                    # Since it's PHP, commas might be inside arrays or function calls
                    # Let's just print the ones where ? count is higher than 3 and check manually
                    pass
                break
