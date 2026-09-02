<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name FROM agents WHERE id = '6a8462ce975a7' OR id = '6a7c7766c18ab' OR id = 'ag_1786544227_6a7c7766c18ab'");
print_r($stmt);
