<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, archived_period FROM agents WHERE id='6a1e2edbec8b0'");
var_dump($res[0]['archived_period']);

$stmtAg2 = $sqlite->prepare("SELECT id FROM agents WHERE subsite_id = ? AND service_id = ? AND (archived_period IS NULL OR archived_period > ?) ORDER BY name");
$stmtAg2->execute(['site_extras_1', 'svc_1780068297_395', '2026-06']);
var_dump($stmtAg2->fetchAll());
