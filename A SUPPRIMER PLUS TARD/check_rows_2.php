<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';

$stmt = $sqlite->prepare("SELECT id, created_at, archived_date FROM archives_pointage WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$pointage_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt2 = $sqlite->prepare("SELECT id FROM archives WHERE company_id = ? AND period = ?");
$stmt2->execute([$company_id, $period]);
$archives_rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "pointage_rows" => $pointage_rows,
    "archives_rows" => $archives_rows
]);
