<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
require 'backend/core/db.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$stmt = $sqlite->query("SELECT company_id FROM sites LIMIT 1");
$companyKey = $stmt->fetchColumn();

// Find the period with YEO YANOUC
$stmt = $sqlite->query("SELECT period FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE name LIKE '%YEO YANOUC%') ORDER BY period DESC LIMIT 1");
$period = $stmt->fetchColumn();
echo "Period: " . $period . "\n";

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);
foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'YEO YANOUC') !== false) {
        echo "Site: " . $s['site'] . "\n";
        echo "Subsite: " . $s['subsite'] . "\n";
        echo "real_active: " . $s['real_active'] . "\n";
        echo "active_days: " . $s['active_days'] . "\n";
        echo "days_worked: " . $s['days_worked'] . "\n";
        print_r($s);
    }
}
