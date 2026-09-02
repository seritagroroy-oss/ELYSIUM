<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT count(*) as cnt FROM agents WHERE company_id = 'comp_cf66d02f' AND subsite_id IN (SELECT id FROM subsites WHERE site_id IN ('site_extras_sur_site', 'site_extras') AND company_id = 'comp_cf66d02f')");
echo json_encode(["agents" => $res[0]['cnt'] ?? 0]);
