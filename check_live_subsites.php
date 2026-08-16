<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT count(*) as cnt FROM subsites WHERE company_id = 'comp_cf66d02f' AND site_id IN ('site_extras_sur_site', 'site_extras')");
echo json_encode(["subsites" => $res[0]['cnt'] ?? 0]);
