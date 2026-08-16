<?php
require_once __DIR__ . '/backend/database.php';
$files = glob('backend/modules/*.php');
$files[] = 'backend/core/functions.php';
foreach ($files as $f) {
    $c = file_get_contents($f);
    if (strpos($c, 'INSERT INTO payroll_snapshots') !== false) {
        echo "Found in $f\n";
    }
}
