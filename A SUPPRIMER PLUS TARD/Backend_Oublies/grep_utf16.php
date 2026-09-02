<?php
$file = __DIR__ . '/../frontend/src/components/Dashboard.jsx';
$content = file_get_contents($file);
$encoding = mb_detect_encoding($content, 'UTF-8, UTF-16LE, UTF-16BE', true);
if ($encoding && $encoding !== 'UTF-8') {
    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
}
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (stripos($line, 'Suppl_Dest') !== false || stripos($line, 'Suppl|') !== false || stripos($line, 'bleu') !== false || stripos($line, 'text-blue') !== false || stripos($line, 'blue') !== false) {
        if (stripos($line, 'blue') !== false && stripos($line, 'Suppl') === false) {
            // only show blue if it looks related to rendering
            if (stripos($line, 'return') !== false || stripos($line, 'span') !== false || stripos($line, 'color') !== false) {
                echo ($i + 1) . ': ' . trim($line) . "\n";
            }
        } else {
            echo ($i + 1) . ': ' . trim($line) . "\n";
        }
    }
}
