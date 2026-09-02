<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$action = 'SECRET_FIX';
$_REQUEST['action'] = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';
$sqlite = getDb();

$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);

ob_start();
$found = 0;
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
        $found++;
        echo "Entry #$found\n";
        echo "Site: " . $s['site'] . " | Subsite: " . $s['subsite'] . "\n";
        echo "active_days: " . $s['active_days'] . "\n";
        echo "days_worked: " . $s['days_worked'] . "\n";
        echo "absences: " . $s['absences'] . "\n";
        echo "sp_details count: " . count($s['sp_details']) . "\n";
        print_r($s['profile_data']['mutation_breakdown'] ?? 'No mutation_breakdown');
        echo "\n--------\n";
    }
}
$content = ob_get_clean();
file_put_contents('c:/laragon/www/pontage/backend/test30_output.txt', $content);
echo "DONE";
