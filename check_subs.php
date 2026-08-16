<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$subs = $sqlite->query("SELECT * FROM subsites WHERE site_id = 'site_itc'");
foreach($subs as $s) {
    echo "Subsite ID: {$s['id']}, Name: {$s['name']}, Company: {$s['company_id']}\n";
}
