<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT shift_type FROM agents WHERE id = 'ag_1786544227_6a7c7766c18ab'");
print_r($stmt);
