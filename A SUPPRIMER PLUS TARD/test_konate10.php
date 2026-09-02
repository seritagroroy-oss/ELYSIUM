<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, company_id, name FROM sites WHERE name LIKE '%ABIDJAN MALL%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
