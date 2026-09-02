<?php
$file = __DIR__ . '/../frontend/src/components/Dashboard.jsx';
$content = file_get_contents($file);
$encoding = mb_detect_encoding($content, 'UTF-8, UTF-16LE, UTF-16BE', true);
if ($encoding && $encoding !== 'UTF-8') {
    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
}
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (stripos($line, 'getCellContent') !== false) {
        echo ($i + 1) . ': ' . trim($line) . "\n";
    }
}
