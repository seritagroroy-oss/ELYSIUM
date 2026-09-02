<?php
require_once dirname(__DIR__) . '/backend/core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT period, company_id, archived_date FROM archives_pointage ORDER BY archived_date DESC LIMIT 10");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
