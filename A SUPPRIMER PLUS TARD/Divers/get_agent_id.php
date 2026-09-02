<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, company_id FROM agents WHERE name LIKE '%ADRO HENRI MICHEL EPHREM%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
