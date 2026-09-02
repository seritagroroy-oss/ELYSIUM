<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT date, shift_code, status, agent_id FROM attendance WHERE period = '2026-08' AND agent_id IN (SELECT id FROM agents WHERE name LIKE '%FELIX%') ORDER BY date ASC LIMIT 20");
print_r($stmt);
