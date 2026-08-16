<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();
$snapshot = json_decode($row['snapshot'], true);

$bureau_agents = [];
foreach ($snapshot as $ag) {
    if (stripos($ag['site'] ?? '', 'BUREAU') !== false || stripos($ag['site'] ?? '', 'ADMINISTRATION') !== false) {
        $bureau_agents[] = $ag;
    }
}
echo "Found " . count($bureau_agents) . " agents in BUREAU/ADMINISTRATION.\n";
if (count($bureau_agents) > 0) {
    $first = $bureau_agents[0];
    echo "First agent name: " . $first['name'] . "\n";
    echo "First agent site: " . $first['site'] . "\n";
    $pd = is_string($first['profile_data']) ? json_decode($first['profile_data'], true) : $first['profile_data'];
    echo "Payment method: " . ($pd['payment_method'] ?? 'none') . "\n";
}
