<?php
require_once __DIR__ . '/backend/database.php';
$db = getDb();
$res = $db->query("SELECT id, company_id, period, LENGTH(data) as size FROM archives_pointage");
print_r($res);
