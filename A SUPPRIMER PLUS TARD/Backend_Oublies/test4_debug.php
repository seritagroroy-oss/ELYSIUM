<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
require 'c:/laragon/www/pontage/backend/core/functions.php';

$sqlite = new PDO('sqlite:c:/laragon/www/pontage/backend/elysium.db');
$stmt = $sqlite->query("SELECT company_id FROM sites LIMIT 1");
$companyKey = $stmt->fetchColumn();

$stmt = $sqlite->query("SELECT period FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE name LIKE '%YEO YANOUC%') ORDER BY period DESC LIMIT 1");
$period = $stmt->fetchColumn();

echo "Period: " . $period . "<br>";

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
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
