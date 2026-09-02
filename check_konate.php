<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['user_role'] = 'admin';
$_SESSION['company_id'] = 'comp_cf66d02f';
$action = 'debug_dddd';

require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';

$stmt = $sqlite->prepare("SELECT * FROM agents WHERE company_id = ? AND name LIKE '%KONATE MOUSTAPHA%'");
$stmt->execute([$companyKey]);
$agent = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$agent) {
    echo "Agent not found.\n";
    exit;
}

echo "Agent ID: " . $agent['id'] . "\n";
echo "Profile: " . print_r(json_decode($agent['profile_data'], true), true) . "\n";

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);

foreach ($salaries as $s) {
    if (strpos(strtoupper($s['name']), 'KONATE MOUSTAPHA') !== false) {
        echo "Salary Data:\n";
        print_r($s);
    }
}
