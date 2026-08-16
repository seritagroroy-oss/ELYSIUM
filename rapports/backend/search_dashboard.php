<?php
header('Content-Type: text/plain');

$output = [];
exec('cd .. && dir /s /b Dashboard*.jsx', $output);
echo "Files found:\n" . implode("\n", $output) . "\n";
?>
