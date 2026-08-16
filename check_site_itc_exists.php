<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

// Check if site_itc exists in sites table for comp_cf66d02f
$rows = $sqlite->query("SELECT * FROM sites WHERE id = 'site_itc'");
echo "site_itc in sites table:\n";
foreach ($rows as $r) {
    echo "ID: {$r['id']}, Name: {$r['name']}, Company: {$r['company_id']}, Service: {$r['service_id']}\n";
}

// Check if site_itc is dynamically generated or static
echo "\n\nAll sites for comp_cf66d02f:\n";
$sites = $sqlite->query("SELECT id, name, company_id, service_id FROM sites WHERE company_id = 'comp_cf66d02f' ORDER BY name");
foreach ($sites as $s) {
    echo "ID: {$s['id']}, Name: {$s['name']}\n";
}

// Also check how many subsites it has
echo "\n\nSubsites of site_itc for comp_cf66d02f:\n";
$subs = $sqlite->query("SELECT id, name, company_id FROM subsites WHERE site_id = 'site_itc' AND company_id = 'comp_cf66d02f'");
foreach ($subs as $s) {
    echo "  ID: {$s['id']}, Name: {$s['name']}\n";
}
