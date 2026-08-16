<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX'; // Bypass session check
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

$sqlite = getDb();

$rows = $sqlite->query("SELECT company_id FROM sites LIMIT 1");
$companyKey = $rows[0]['company_id'] ?? 'comp_default_1';
$period = '2026-08';

echo "Period: " . $period . "<br>";
$agent_id = 'ag_1786446331_6a43e09f282ec';

$salaries = generateSalariesData($sqlite, $period, null, 'company_id', $companyKey, $agent_id);

echo "<pre>";
print_r($salaries);
echo "</pre>";
