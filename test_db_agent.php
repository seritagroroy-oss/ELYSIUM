<?php
require 'backend/database.php';
$sqlite = getDb();
$serviceKey = 'svc_1780068297_395';
$period = '2026-06';
// query
$stmtAg2 = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name");
$stmtAg2->execute(['site_extras_1', $serviceKey, $period]);
$agents_rows = $stmtAg2->fetchAll();
print_r($agents_rows);
