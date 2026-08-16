<?php
echo "<pre>";
echo "Starting build v2...\n";
chdir(__DIR__ . '/frontend');
$output = [];
$return_var = 0;
exec("npm run build 2>&1", $output, $return_var);
echo "Return: $return_var\n";
echo implode("\n", $output);
echo "</pre>";
