<?php
require_once __DIR__ . '/backend/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT * FROM sites WHERE name LIKE '%vivier%' OR name LIKE '%EXTRA%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
