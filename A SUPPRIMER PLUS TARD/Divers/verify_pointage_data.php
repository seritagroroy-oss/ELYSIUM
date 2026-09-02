<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';

$stmt = $sqlite->prepare("SELECT data FROM archives_pointage WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$archive = $stmt->fetch(PDO::FETCH_ASSOC);

$data = json_decode($archive['data'], true);

$extras = null;
foreach ($data['sites'] as $site) {
    if ($site['id'] === 'site_extras_sur_site') {
        $extras = $site;
        break;
    }
}

if ($extras) {
    $zones = [];
    $total_agents = 0;
    foreach ($extras['subsites'] as $sub) {
        $zones[] = $sub['name'] . " (" . count($sub['agents']) . " agents)";
        $total_agents += count($sub['agents']);
    }
    echo json_encode([
        "site_name" => $extras['name'],
        "total_zones" => count($extras['subsites']),
        "total_agents" => $total_agents,
        "zones" => $zones
    ]);
} else {
    echo json_encode(["error" => "site_extras_sur_site not found in pointage archive"]);
}
