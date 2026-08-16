<?php
require_once __DIR__ . '/backend/database.php';
$db = getDb();
$stmt = $db->query("DESCRIBE archives_pointage");
print_r($stmt);
