<?php
require_once __DIR__ . '/backend/core/db.php';
$sqlite = getDb();

// Load attendance for ABEHI YAPO
$stmt = $sqlite->query("SELECT a.id as agent_id, a.name, a.shift_type, sub.id as subsite_id, sub.name as subsite_name, att.date, att.shift_code, att.status 
FROM attendance att 
JOIN agents a ON a.id = att.agent_id 
LEFT JOIN subsites sub ON sub.id = a.subsite_id 
WHERE a.name LIKE '%ABEHI YAPO%' AND att.period = '2026-08'");
$atts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = [];
foreach($atts as $r) {
    $data[$r['subsite_name']][$r['agent_id']]['shift_type'] = $r['shift_type'];
    $data[$r['subsite_name']][$r['agent_id']]['name'] = $r['name'];
    $data[$r['subsite_name']][$r['agent_id']]['att'][$r['shift_code']][$r['date']] = $r['status'];
}
echo json_encode($data, JSON_PRETTY_PRINT);
