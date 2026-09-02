<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("
    SELECT a.id as att_id, a.date, a.status, a.service_id, a.company_id, ag.name, ag.id as agent_id
    FROM attendance a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE ag.name LIKE '%KONATE MOUSTAPHA%' AND a.period = '2026-08'
    ORDER BY a.date ASC
");
$stmt->execute([]);
$atts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$res = [];
foreach ($atts as $a) {
    $res[$a['company_id']][$a['service_id']][] = [
        'date' => $a['date'],
        'status' => $a['status'],
        'agent_id' => $a['agent_id']
    ];
}
echo json_encode($res, JSON_PRETTY_PRINT);
