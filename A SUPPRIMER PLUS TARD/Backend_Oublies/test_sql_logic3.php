<?php
require_once 'database.php';
$sqlite = getDb();
$period = '2026-07';

$stmt = $sqlite->prepare("
    SELECT COUNT(DISTINCT a.agent_id) as count
    FROM attendance a
    WHERE a.period = ?
    AND (a.status LIKE '%EXTRA SUR SITE%' OR a.status LIKE '%site_extras_sur_site%')
");
$stmt->execute([$period]);
$count_all = $stmt->fetchColumn();

echo "Total agents with EXTRA SUR SITE or site_extras_sur_site in status: " . $count_all . "\n";
