<?php
require_once dirname(__DIR__) . '/backend/database.php';
$sqlite = getDb();
// Find bhbh
$stmt = $sqlite->prepare("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%bhbh%'");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($agents);
