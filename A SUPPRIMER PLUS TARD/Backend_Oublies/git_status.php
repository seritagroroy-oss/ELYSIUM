<?php
header('Content-Type: text/plain');

$output = [];
exec('cd .. && git status', $output);
echo "git status:\n" . implode("\n", $output) . "\n";
?>
