<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

$period = '2026-08';
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->query("
    SELECT COUNT(*) as cnt 
    FROM attendance att
    JOIN agents a ON att.agent_id = a.id
    WHERE att.period = '$period' AND att.company_id = '$company_id' AND a.subsite_id LIKE 'itc_%'
");

echo "Pointages ITC pour août 2026: " . $stmt[0]['cnt'] . "\n";
