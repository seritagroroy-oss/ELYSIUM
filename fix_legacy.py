lines = open('api.php', 'r', encoding='utf-8').readlines()
# Remove old legacy block: lines 3688-3756 (1-indexed) = indices 3687-3755 (0-indexed)
del lines[3687:3756]
# Insert the case label at index 3687
lines.insert(3687, "    case 'create_service_account':\r\n")
open('api.php', 'w', encoding='utf-8').writelines(lines)
print('Done. Total lines:', len(lines))
