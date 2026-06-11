<?php
require 'backend/database.php';
$sqlite = getDb();

$period = '2026-07';
$target_val = 'comp_default_1';
$target_col = 'company_id';

$stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE $target_col = ?");
$stmtSites->execute([$target_val]);
$sites_rows = $stmtSites->fetchAll();

$salaries = [];

foreach ($sites_rows as $site) {
    $stmtSub2 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ?");
    $stmtSub2->execute([$site['id']]);
    $subsites_rows = $stmtSub2->fetchAll();

    foreach ($subsites_rows as $sub) {
        $stmtAg2 = $sqlite->prepare(
            "SELECT * FROM agents WHERE subsite_id = ? AND $target_col = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name"
        );
        $stmtAg2->execute([$sub['id'], $target_val, $period]);
        $agents_rows = $stmtAg2->fetchAll();

        foreach ($agents_rows as $agent) {
            $salaries[] = $agent['name'];
        }
    }
}
echo "Found " . count($salaries) . " agents.\n";
print_r($salaries);
