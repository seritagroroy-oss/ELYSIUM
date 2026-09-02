<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM agents WHERE name LIKE '%KONATE%'");
print_r($stmt);
