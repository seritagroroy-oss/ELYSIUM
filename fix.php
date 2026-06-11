<?php
$content = file_get_contents('api.php');
$content = str_replace(
    "if (\$merge_mode === 'classic' || in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Jour') {",
    "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Jour') {",
    $content
);
$content = str_replace(
    "if (\$merge_mode === 'classic' || in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Nuit') {",
    "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Nuit') {",
    $content
);
file_put_contents('api.php', $content);
echo "Done";
