<?php
$content = file_get_contents('api.php');

// Split the content into lines
$lines = explode("\n", $content);

$inside_pm = false;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], "\$status_new = 'PM|'") !== false) {
        $inside_pm = true;
    }
    
    if (strpos($lines[$i], "} else {") !== false && strpos($lines[$i+1], "// Après mutation") !== false) {
        $inside_pm = false;
    }
    
    if ($inside_pm) {
        if (strpos($lines[$i], "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Jour') {") !== false) {
            $lines[$i] = str_replace(
                "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Jour') {",
                "if (\$merge_mode === 'classic' || in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Jour') {",
                $lines[$i]
            );
        }
        if (strpos($lines[$i], "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Nuit') {") !== false) {
            $lines[$i] = str_replace(
                "if (in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Nuit') {",
                "if (\$merge_mode === 'classic' || in_array(strtolower(\$actual_orig_stype), ['24h', '48h', '72h']) || \$actual_orig_stype === 'Nuit') {",
                $lines[$i]
            );
        }
    }
}

file_put_contents('api.php', implode("\n", $lines));
echo "Done fix2";
