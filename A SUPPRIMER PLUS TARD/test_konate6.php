<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name FROM sites WHERE company_id = '1782478544_525'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
