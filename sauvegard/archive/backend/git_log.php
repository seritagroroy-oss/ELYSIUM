<?php
header('Content-Type: text/plain');
$output = [];
exec('cd .. && git log -1', $output);
echo "git log:\n" . implode("\n", $output) . "\n";
?>
