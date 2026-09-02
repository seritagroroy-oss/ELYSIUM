<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$action = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

$sqlite = getDb();
$salaries = generateSalariesData($sqlite, '2026-08', 'comp_cf66d02f', 'company_id', 'comp_cf66d02f', null);
foreach ($salaries as $s) {
    if (strpos($s['name'], 'YEO YANOUC') !== false) {
        echo "Agent: " . $s['name'] . "\n";
        echo "active_days: " . $s['active_days'] . "\n";
        echo "days_worked: " . $s['days_worked'] . "\n";
        echo "absences: " . $s['absences'] . "\n";
        echo "entrant_sortant_count: " . $s['entrant_sortant_count'] . "\n";
    }
}
