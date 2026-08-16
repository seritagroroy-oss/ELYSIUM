<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Check how site_extras, site_releves, site_administration are configured
$specials = ['site_extras', 'site_releves', 'site_administration', 'site_extras_sur_site'];
foreach ($specials as $sid) {
    $r = $sqlite->query("SELECT id, name, company_id, service_id FROM sites WHERE id = '$sid'");
    if (!empty($r)) {
        echo "ID: {$r[0]['id']}, Name: {$r[0]['name']}, Company: {$r[0]['company_id']}, Service: {$r[0]['service_id']}\n";
    } else {
        echo "NOT FOUND: $sid\n";
    }
}
