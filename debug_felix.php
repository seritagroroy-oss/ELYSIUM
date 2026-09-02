<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT date, shift_code, status, agent_id FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE name LIKE '%FELIX%')");
print_r($stmt);
