<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);
require 'database.php';

$sqlite = new PDO('sqlite:' . $path);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$site_id = '1783054813_799';

$stmtSched = $sqlite->prepare("
    SELECT s.day_of_week, s.target_subsite_id, ag.*
    FROM agent_schedules s
    JOIN agents ag ON s.agent_id = ag.id
    WHERE s.target_site_id = ?
");
$stmtSched->execute([$site_id]);
$schedules = $stmtSched->fetchAll(PDO::FETCH_ASSOC);

$releve_agents_map = [];
foreach ($schedules as $row) {
    $ag_id = $row['id']; // This is ag.id
    if (!isset($releve_agents_map[$ag_id])) {
        $releve_agents_map[$ag_id] = $row;
        $releve_agents_map[$ag_id]['scheduled_days'] = [];
        $releve_agents_map[$ag_id]['scheduled_days_by_subsite'] = [];
        $releve_agents_map[$ag_id]['target_subsites'] = [];
    }
    $releve_agents_map[$ag_id]['scheduled_days'][] = $row['day_of_week'];
    $sub_key = !empty($row['target_subsite_id']) ? $row['target_subsite_id'] : 'default';
    if (!isset($releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key])) {
        $releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key] = [];
    }
    $releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key][] = $row['day_of_week'];
    if (!empty($row['target_subsite_id']) && !in_array($row['target_subsite_id'], $releve_agents_map[$ag_id]['target_subsites'])) {
        $releve_agents_map[$ag_id]['target_subsites'][] = $row['target_subsite_id'];
    }
}

$stmtSubs = $sqlite->prepare("SELECT id, name FROM subsites WHERE site_id = ?");
$stmtSubs->execute([$site_id]);
$subsites = $stmtSubs->fetchAll(PDO::FETCH_ASSOC);

foreach ($subsites as &$sub) {
    $sub['agents'] = [];
}
unset($sub);

$scheduled_releves = array_values($releve_agents_map);

foreach ($scheduled_releves as $rel_agent) {
    $target_subs = $rel_agent['target_subsites'] ?? [];
    echo "AGENT: " . $rel_agent['name'] . "\n";
    echo "TARGET_SUBS: " . implode(', ', $target_subs) . "\n";
    
    foreach ($subsites as $k => $s) {
        if (in_array($s['id'], $target_subs)) {
            $subsites[$k]['agents'][] = $rel_agent;
            echo "ADDED TO: " . $s['name'] . "\n";
        }
    }
}

echo "\nFINAL COUNTS:\n";
foreach ($subsites as $s) {
    echo $s['name'] . ": " . count($s['agents']) . "\n";
}
