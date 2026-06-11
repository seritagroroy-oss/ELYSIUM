<?php
require 'backend/database.php';
$sqlite = getDb();
$period = '2026-07';
$target_col = 'company_id';
$target_val = 'comp_default_1';

$stmt = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ?");
$stmt->execute([$target_val]);
$sites_rows = $stmt->fetchAll();

$salaries = [];
foreach ($sites_rows as $site) {
    $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
    $stmtSub2->execute([$site['id']]);
    $subsites_rows = $stmtSub2->fetchAll();
    
    foreach ($subsites_rows as $sub) {
        $stmtAg2 = $sqlite->prepare(
            "SELECT * FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period > ?)"
        );
        $stmtAg2->execute([$sub['id'], $target_val, $period]);
        $agents_rows2 = $stmtAg2->fetchAll();
        foreach ($agents_rows2 as $agent) {
            $salaries[] = ['name' => $agent['name'], 'site' => $site['name']];
        }
    }
}

$siteCounts = [];
foreach ($salaries as $s) {
    $siteCounts[$s['site']] = ($siteCounts[$s['site']] ?? 0) + 1;
}
print_r($siteCounts);
