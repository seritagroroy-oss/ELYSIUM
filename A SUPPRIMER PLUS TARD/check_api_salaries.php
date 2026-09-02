<?php
require __DIR__ . '/backend/database.php';
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['user_role'] = 'admin';
$_POST['action'] = 'get_salaries';
$_POST['period'] = '2026-07';

ob_start();
require __DIR__ . '/backend/api_new.php';
$output = ob_get_clean();

$data = json_decode($output, true);
if (is_array($data)) {
    $names = [];
    foreach (array_slice($data, 0, 5) as $ag) {
        $names[] = $ag['name'] ?? 'NO_NAME';
    }
    echo "First 5 names: " . implode(", ", $names) . "\n";
    
    $d_found = false;
    foreach ($data as $ag) {
        if (isset($ag['name']) && strtolower(trim($ag['name'])) === 'd') {
            $d_found = true;
        }
    }
    echo "Is 'd' found? " . ($d_found ? 'YES' : 'NO') . "\n";
} else {
    echo "Output is not an array: " . substr($output, 0, 100);
}
