<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';

// Clear OPCache!
if (function_exists('opcache_reset')) {
    opcache_reset();
}

require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

error_reporting(0); // I'll hide warnings this time
ini_set('display_errors', 0);

$sqlite = getDb();

// Find YEO's agent_id, company_id from attendance
$stmt = $sqlite->query("SELECT a.agent_id, a.company_id, ag.name FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE ag.name LIKE '%YEO YANOUC%' ORDER BY a.period DESC LIMIT 1");
$row = $stmt[0];

$agent_id = $row['agent_id'];
$company_id = $row['company_id'];
$period = '2026-08'; // The period we are debugging

echo "Period: $period <br>";
echo "Agent: {$row['name']} ($agent_id)<br>";
echo "Company: $company_id<br>";

// Run generation exactly for this company!
$salaries = generateSalariesData($sqlite, $period, $company_id, 'company_id', $company_id, null);

$found = false;
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
        $found = true;
        echo "<b>Site:</b> " . $s['site'] . "<br>";
        echo "<b>real_active:</b> " . $s['real_active'] . "<br>";
        echo "<b>active_days:</b> " . $s['active_days'] . "<br>";
        echo "<b>days_worked:</b> " . $s['days_worked'] . "<br>";
        echo "<b>absences:</b> " . $s['absences'] . "<br>";
        echo "<b>entrant_sortant_count:</b> " . $s['entrant_sortant_count'] . "<br>";
        echo "<pre>";
        print_r($s);
        echo "</pre><hr>";
    }
}

if (!$found) {
    echo "YEO YANOUC not found in salaries array for company $company_id!";
}
