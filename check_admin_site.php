<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$stmt = $sqlite->prepare("SELECT * FROM sites WHERE company_id = ? AND LOWER(name) LIKE '%admin%'");
$stmt->execute([$company_id]);
print_r($stmt->fetchAll());
