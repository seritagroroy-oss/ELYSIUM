<?php
require_once 'database.php';
$sqlite = getDb();

$period = '2026-07';

$stmt = $sqlite->prepare("
    SELECT COUNT(DISTINCT a.agent_id) as count
    FROM attendance a
    WHERE a.period = ?
    AND a.status LIKE '%EXTRA SUR SITE%'
");
$stmt->execute([$period]);
$count_all = $stmt->fetchColumn();

$stmt2 = $sqlite->prepare("
    SELECT DISTINCT a.status
    FROM attendance a
    WHERE a.period = ?
    AND a.status LIKE '%EXTRA SUR SITE%'
");
$stmt2->execute([$period]);
$statuses = $stmt2->fetchAll(PDO::FETCH_COLUMN);

echo "Total agents with 'EXTRA SUR SITE' in status: " . $count_all . "\n";
print_r($statuses);
