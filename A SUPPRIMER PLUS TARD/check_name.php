<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT name FROM agents WHERE company_id = ? AND name LIKE '%KOUAKOU BAH%'");
$stmt->execute([$company_id]);
$agents = $stmt->fetchAll();
print_r($agents);
