<?php
require_once __DIR__ . '/backend/core/db.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT a.id, a.name, s.name as site, att.date, att.shift_code, att.status FROM attendance att JOIN agents a ON a.id = att.agent_id LEFT JOIN subsites sub ON sub.id = a.subsite_id LEFT JOIN sites s ON s.id = sub.site_id WHERE a.name LIKE '%KONATE MOUSTAPHA%' AND att.period = '2026-07' ORDER BY att.date ASC;");
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($results, JSON_PRETTY_PRINT);
