<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, site_id FROM subsites WHERE site_id = 'site_extras_sur_site' LIMIT 5");
echo json_encode($res);
