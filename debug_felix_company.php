<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name, company_id FROM agents WHERE name LIKE '%FELIX%'");
print_r($stmt);
