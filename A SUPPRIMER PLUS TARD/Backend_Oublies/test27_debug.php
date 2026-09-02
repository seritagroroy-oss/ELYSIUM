<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$action = 'SECRET_FIX';
$_REQUEST['action'] = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';
$sqlite = getDb();

// 2. Run salary generation for the company
$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);

// 3. Find YEO YANOUC
ob_start();
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
        echo "Site: " . $s['site'] . "\n";
        echo "active_days: " . $s['active_days'] . "\n";
        echo "days_worked: " . $s['days_worked'] . "\n";
        echo "absences: " . $s['absences'] . "\n";
        print_r($s['mutation_breakdown'] ?? 'No mutation_breakdown');
        echo "\n--------\n";
    }
}
$content = ob_get_clean();
file_put_contents('c:/laragon/www/pontage/backend/test27_output.txt', $content);
echo "DONE";
