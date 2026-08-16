<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';
$sqlite = getDb();

// 1. Force the status to A on the old site for the 21st
$sqlite->exec("UPDATE attendance SET status = 'A' WHERE agent_id = '6a43e09f282ec' AND date = '2026-07-21'");

// 2. Run salary generation for the company
$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);

// 3. Find YEO YANOUC
ob_start();
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
        echo "<b>Site:</b> " . $s['site'] . "\n";
        echo "<b>active_days:</b> " . $s['active_days'] . "\n";
        echo "<b>days_worked:</b> " . $s['days_worked'] . "\n";
        echo "<b>absences:</b> " . $s['absences'] . "\n";
        print_r($s['mutation_breakdown'] ?? 'No mutation_breakdown');
        echo "\n--------\n";
    }
}
$content = ob_get_clean();
file_put_contents('c:/laragon/www/pontage/backend/test26_output.txt', $content);
echo "DONE";
