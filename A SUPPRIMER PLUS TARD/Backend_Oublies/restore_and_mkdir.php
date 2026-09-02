<?php
header('Content-Type: text/plain');

$output = [];
$return_var = 0;
exec('git checkout frontend/src/components/Dashboard.jsx', $output, $return_var);
echo "git checkout: " . implode("\n", $output) . " (Return: $return_var)\n";

$tablesDir = __DIR__ . '/../frontend/src/components/tables';
if (!file_exists($tablesDir)) {
    mkdir($tablesDir, 0777, true);
    echo "Created $tablesDir\n";
} else {
    echo "Directory $tablesDir already exists\n";
}
?>
