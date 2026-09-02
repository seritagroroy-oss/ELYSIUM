<?php
$file = 'C:/laragon/www/pontage/backend/modules/sites_v2.php';
$content = file_get_contents($file);

$lines = explode("\n", $content);
$stack = [];
$case_line = -1;

for ($i = 0; $i < count($lines); $i++) {
    $line = $lines[$i];
    for ($j = 0; $j < strlen($line); $j++) {
        if ($line[$j] === '{') {
            $stack[] = $i + 1;
        } elseif ($line[$j] === '}') {
            if (empty($stack)) {
                echo "Unmatched } at line " . ($i + 1) . "\n";
            } else {
                array_pop($stack);
            }
        }
    }
    if (strpos($line, "case 'add_agent':") !== false) {
        $case_line = $i + 1;
        echo "Found case 'add_agent': at line $case_line with stack depth " . count($stack) . "\n";
    }
}
echo "Stack size at end: " . count($stack) . "\n";
