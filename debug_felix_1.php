<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT date, shift_code, status FROM attendance WHERE period = '2026-08' AND agent_id = '6a8462ce975a7' ORDER BY date ASC");
print_r($stmt);
