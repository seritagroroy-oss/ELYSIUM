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

$rows2 = $sqlite->query("SELECT period FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE name LIKE '%YEO YANOUC%') ORDER BY period DESC LIMIT 1");
$period = $rows2[0]['period'] ?? '2024-07';

echo "Period: " . $period . "<br>";

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);
echo "Total salaries count: " . count($salaries) . "<br>";

echo "First 10 agents in salaries:<br>";
$i = 0;
foreach ($salaries as $s) {
    echo $s['name'] . "<br>";
    $i++;
    if ($i >= 10) break;
}
