<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, period, SUBSTR(data, 1, 500) as dat FROM archives WHERE company_id = 'comp_cf66d02f'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
