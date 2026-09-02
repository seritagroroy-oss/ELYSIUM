<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT DISTINCT agent_id FROM attendance WHERE period = '2026-08' AND agent_id LIKE '%3806%'");
print_r($stmt);
