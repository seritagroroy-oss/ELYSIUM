<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_cf66d02f';

$sqlite = getDb();
$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);
foreach ($salaries as $s) {
    if ($s['id'] === '6a43e09f282ec' || $s['name'] === 'YEO YANOUC') {
        echo "Agent: " . $s['name'] . "\n";
        echo "active_days: " . $s['active_days'] . "\n";
        echo "days_worked: " . $s['days_worked'] . "\n";
        echo "absences: " . $s['absences'] . "\n";
        echo "entrant_sortant_count: " . $s['entrant_sortant_count'] . "\n";
        echo "Profile data:\n";
        print_r($s['profile_data']);
    }
}
