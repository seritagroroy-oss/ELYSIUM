<?php
session_start();
$_SESSION['user_id'] = 1;
require "backend/database.php";
require "backend/core/functions.php";

$sqlite = getDb();
$_SERVER['HTTP_HOST'] = 'pontage.test';
$period = '2026-08';

$rows = $sqlite->query("SELECT company_id, service_id FROM archives WHERE id LIKE 'payroll_%' AND period = '$period'");

foreach ($rows as $row) {
    $companyKey = $row['company_id'];
    $serviceKey = $row['service_id'];
    $_SESSION['company_id'] = $companyKey;
    
    // Generate fresh salaries
    $salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
    
    $sites = $sqlite->query("SELECT id, name FROM sites WHERE company_id = '$companyKey'");
    
    $has_extras = false;
    $has_extras_sur_site = false;
    $has_releves = false;
    $has_admin = false;
    foreach ($sites as $s) {
        if ($s['id'] === 'site_extras') $has_extras = true;
        if ($s['id'] === 'site_extras_sur_site') $has_extras_sur_site = true;
        if ($s['id'] === 'site_releves') $has_releves = true;
        if ($s['id'] === 'site_administration') $has_admin = true;
    }
    if (!$has_releves) $sites[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves'];
    
    $archive = [
        'period' => $period,
        'archived_at' => date('Y-m-d H:i:s'),
        'archived_by' => 'Auto-Archivage (Regen Tool)',
        'salaries' => $salaries,
        'statuses' => [],
        'sites' => $sites
    ];
    
    $archive_id = 'payroll_' . $period;
    
    // 1. Update SQLite
    $stmtIns = $sqlite->prepare("REPLACE INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?)");
    $stmtIns->execute([$archive_id, $serviceKey, $companyKey, $period, json_encode($archive)]);
    
    // 2. Update JSON fallback to prevent ghosting
    $dbData = getScopedData($serviceKey);
    $dbData['payroll_archives'][$period] = $archive;
    saveScopedData($dbData, $serviceKey);
    
    echo "Regenerated archive for $companyKey / $serviceKey.\n";
}

echo "\nDone!\n";
?>
