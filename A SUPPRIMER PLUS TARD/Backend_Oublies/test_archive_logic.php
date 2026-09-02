<?php
require_once 'database.php';
$sqlite = getDb();
$period = '2026-07';

$site = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];
$subsitesMap = ['default_site_extras_sur_site' => ['id' => 'default_site_extras_sur_site', 'name' => 'Zone Principale', 'agents' => []]];
$subIds = array_keys($subsitesMap);

// Simulate the logic
$clean_site_name = trim(str_replace(['🌟', '🔄', '🏢'], '', $site['name']));
$like_m = 'M|%' . $clean_site_name . '%';
$like_ext = 'EXT%|%' . $clean_site_name . '%';
$like_rel = 'REL%|%' . $clean_site_name . '%';

$suppl_conditions = [];
$suppl_params = [];
$suppl_conditions[] = "a.status = ?";
$suppl_params[] = 'Suppl|' . $site['id'];
foreach ($subIds as $sb_id) {
    $suppl_conditions[] = "a.status = ?";
    $suppl_params[] = 'Suppl|' . $sb_id;
}
$suppl_sql = implode(' OR ', $suppl_conditions);
if (empty($suppl_sql)) $suppl_sql = "1=0";

$stmt_mut = $sqlite->prepare("
   SELECT DISTINCT a.agent_id, ag.*
   FROM attendance a
   JOIN agents ag ON a.agent_id = ag.id
   WHERE a.period = ?
   AND a.status IS NOT NULL AND a.status != '' AND a.status != '1' AND a.status != 'Repos'
   AND (a.status LIKE ? OR a.status LIKE ? OR a.status LIKE ? OR ($suppl_sql))
");
$params_mut = [$period, $like_m, $like_ext, $like_rel];
foreach ($suppl_params as $sp) {
    $params_mut[] = $sp;
}
$stmt_mut->execute($params_mut);
$mutatedRows = $stmt_mut->fetchAll(PDO::FETCH_ASSOC) ?: [];

echo "MUTATED ROWS FOUND: " . count($mutatedRows) . "\n";
print_r(array_column($mutatedRows, 'name'));
