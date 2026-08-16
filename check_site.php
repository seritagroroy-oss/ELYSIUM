<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$sub = $sqlite->query("SELECT * FROM subsites WHERE id = '1782478544_525_1'");
$site_id = $sub[0]['site_id'];
$site = $sqlite->query("SELECT * FROM sites WHERE id = '$site_id'");
echo "Site Name: {$site[0]['name']} (ID: $site_id)\n";
