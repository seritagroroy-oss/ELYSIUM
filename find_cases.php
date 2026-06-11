<?php
$lines = file('api.php');
$currentCase = '';
$uniqueCases = [];
foreach ($lines as $line) {
    if (preg_match('/case\s+\'([^\']+)\'/', $line, $matches)) {
        $currentCase = $matches[1];
    }
    if (strpos($line, 'getScopedData') !== false) {
        $uniqueCases[$currentCase] = true;
    }
}
print_r(array_keys($uniqueCases));
