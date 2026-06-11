<?php
$content = file_get_contents('api.php');
// We need to use multi_replace_file_content or a script to clean legacy blocks.
// Actually, it's easier if I just run a regex replace script.
$content = preg_replace('/[ \t]*\$db\s*=\s*getScopedData\(\$serviceKey\);\s*\$db\[\'sites\'\]\[\]\s*=\s*\[[^;]+\];\s*saveScopedData\(\$db,\s*\$serviceKey\);/s', '', $content);
$content = preg_replace('/[ \t]*\/\/ Keep legacy sync.*?\n\s*\$db\s*=\s*getScopedData\(\$serviceKey\);\s*\$db\[\'sites\'\]\[\]\s*=\s*\[.*?\n\s*\n\s*saveScopedData\(\$db,\s*\$serviceKey\);/s', '', $content);
// That regex is too risky.
