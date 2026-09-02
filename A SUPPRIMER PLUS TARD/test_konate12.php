<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM subsites WHERE id IN ('1782478544_525_1', 'site_extras_1', 'sub_1782830065_5830')");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
