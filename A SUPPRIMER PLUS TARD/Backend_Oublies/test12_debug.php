<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX'; // Bypass session check
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

error_reporting(0); // Hide warnings!
ini_set('display_errors', 0);

$sqlite = getDb();

$rows = $sqlite->query("SELECT company_id FROM sites LIMIT 1");
$companyKey = $rows[0]['company_id'] ?? 'comp_default_1';

$period = '2026-08';

echo "Period: " . $period . "<br>";

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);
echo "Total salaries count: " . count($salaries) . "<br>";

echo "All agents in salaries:<br><ol>";
foreach ($salaries as $s) {
    echo "<li>" . htmlspecialchars($s['name']) . "</li>";
}
echo "</ol>";
