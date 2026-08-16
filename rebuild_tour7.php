<?php
$frontendPath = 'c:\\laragon\\www\\pontage\\frontend';
$command = 'cd ' . escapeshellarg($frontendPath) . ' && npm.cmd run build 2>&1';
exec($command, $output, $return_var);
echo "Return code: " . $return_var . "\n";
echo implode("\n", $output);
?>
