<?php
require 'backend/database.php';
$sqlite = getDb();

// Find an agent with 24h in agents table
$agents = $sqlite->query("SELECT id, name, shift_type FROM agents WHERE shift_type = '24h' AND archived_period IS NULL LIMIT 5");
print_r($agents);

$stmt2 = $sqlite->query("SELECT id, name, shift_type FROM agents WHERE shift_type LIKE '%24h%' LIMIT 5");
print_r($stmt2);

$stmt3 = $sqlite->query("SELECT agent_id, count(*) as c, status FROM attendance WHERE period = '2026-06' AND agent_id IN (SELECT id FROM agents WHERE shift_type = '24h') GROUP BY agent_id, status");
print_r($stmt3);
