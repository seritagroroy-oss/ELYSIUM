<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM sites WHERE id = 'site_1783853173_6938'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
