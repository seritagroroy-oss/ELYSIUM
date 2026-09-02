<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT date, shift_code, status FROM attendance WHERE period = '2026-08' AND agent_id = 'ag_1786544227_6a7c7766c18ab' ORDER BY date ASC");
print_r($stmt);
