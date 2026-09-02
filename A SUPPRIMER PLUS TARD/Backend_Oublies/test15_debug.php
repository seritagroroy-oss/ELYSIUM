<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';
require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

$sqlite = getDb();

// Find YEO's agent_id, company_id, site_id from attendance
$stmt = $sqlite->query("SELECT a.agent_id, a.company_id, a.site_id, ag.name FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE ag.name LIKE '%YEO YANOUC%' ORDER BY a.period DESC LIMIT 1");
$row = $stmt[0];

$agent_id = $row['agent_id'];
$company_id = $row['company_id'];
$period = '2026-08'; // The period you're debugging

echo "Period: $period <br>";
echo "Agent: {$row['name']} ($agent_id)<br>";
echo "Company: $company_id<br>";

// Run generation exactly for this agent!
$salaries = generateSalariesData($sqlite, $period, $company_id, 'agent_id', $agent_id, null);

echo "<pre>";
print_r($salaries);
echo "</pre>";
