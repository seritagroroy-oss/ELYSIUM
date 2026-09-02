<?php
// Restore pointage.php to undo the bad multi_replace
copy('c:\\laragon\\www\\pontage\\sauvegard\\pointage.php', 'c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php');
echo "Restored pointage.php\n";

$content = file_get_contents('c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php');

// 1. Fix get_dashboard_init SQL LIKE parameters
$content = str_replace(
    "\$like_m = 'M|' . \$site_name;\n                    \$like_ext = 'EXT%|' . \$site_name;\n                    \$like_rel = 'REL%|' . \$site_name;",
    "\$clean_site_name = trim(str_replace(['🌟', '🔄', '🏢'], '', \$site_name));\n                    \$like_m = 'M|%' . \$clean_site_name . '%';\n                    \$like_ext = 'EXT%|%' . \$clean_site_name . '%';\n                    \$like_rel = 'REL%|%' . \$clean_site_name . '%';",
    $content
);

// 2. Fix get_dashboard_init strict string comparison for mutated agents
$content = str_replace(
    "if (\$att['status'] === 'M|' . \$site_name) {",
    "if (strpos(\$att['status'], 'M|' . \$clean_site_name) === 0 || strpos(\$att['status'], 'M|%' . \$clean_site_name) === 0 || strpos(\$att['status'], 'M|') === 0 && strpos(\$att['status'], \$clean_site_name) !== false) {",
    $content
);
$content = str_replace(
    "else if (\$att['status'] === 'EXT|' . \$site_name || \$att['status'] === 'REL|' . \$site_name) {",
    "else if ((strpos(\$att['status'], 'EXT|') === 0 || strpos(\$att['status'], 'REL|') === 0) && strpos(\$att['status'], \$clean_site_name) !== false) {",
    $content
);
$content = str_replace(
    "} else if ((strpos(\$att['status'], 'EXT_1|') === 0 || strpos(\$att['status'], 'REL_1|') === 0 || strpos(\$att['status'], 'M_1|') === 0 || strpos(\$att['status'], 'REL_T|') === 0) && strpos(\$att['status'], '|' . \$site_name) !== false) {",
    "} else if ((strpos(\$att['status'], 'EXT_1|') === 0 || strpos(\$att['status'], 'REL_1|') === 0 || strpos(\$att['status'], 'M_1|') === 0 || strpos(\$att['status'], 'REL_T|') === 0) && strpos(\$att['status'], \$clean_site_name) !== false) {",
    $content
);

file_put_contents('c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php', $content);
echo "Fixed pointage.php\n";
