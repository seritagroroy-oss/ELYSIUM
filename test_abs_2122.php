<?php
require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();

// Check attendance for ALL agents on the dates 21 and 22 july in ABIDJAN MALL subsite
$stmt = $sqlite->prepare("
    SELECT a.date, a.status, a.agent_id, ag.name, a.service_id
    FROM attendance a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.service_id = 'sub_1782830065_5830'
    AND a.date IN ('2026-07-21', '2026-07-22')
    AND a.period = '2026-08'
");
$stmt->execute([]);
echo "Attendance on ABIDJAN MALL (sub_1782830065_5830) for 21-22 July:\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n\n";
// Also check any attendance in EXTRAS BUREAUX ABIDJAN service for those dates
$stmt2 = $sqlite->prepare("
    SELECT a.date, a.status, a.agent_id, ag.name, a.service_id
    FROM attendance a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.service_id = 'site_extras_1'
    AND a.date IN ('2026-07-21', '2026-07-22')
    AND a.period = '2026-08'
");
$stmt2->execute([]);
echo "Attendance on EXTRAS BUREAUX ABIDJAN (site_extras_1) for 21-22 July:\n";
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
