<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

echo "=== Enquête sur PNCR CITE LEMANIA ===\n";

$sites = $sqlite->query("SELECT * FROM sites WHERE name LIKE '%PNCR%' OR name LIKE '%LEMANIA%'");
echo "Sites dans DB active:\n";
foreach($sites as $s) {
    echo " - {$s['name']} (ID: {$s['id']})\n";
}

$subsites = $sqlite->query("SELECT * FROM subsites WHERE name LIKE '%PNCR%' OR name LIKE '%LEMANIA%'");
echo "\nSubsites dans DB active:\n";
foreach($subsites as $s) {
    echo " - {$s['name']} (ID: {$s['id']})\n";
}

$agents = $sqlite->query("SELECT count(*) as c FROM agents WHERE subsite_id IN (SELECT id FROM subsites WHERE name LIKE '%PNCR%' OR name LIKE '%LEMANIA%')");
echo "\nAgents actifs dans ces subsites: {$agents[0]['c']}\n";

$archived_agents = $sqlite->query("SELECT count(*) as c FROM agents WHERE archived_period IS NOT NULL AND subsite_id IN (SELECT id FROM subsites WHERE name LIKE '%PNCR%' OR name LIKE '%LEMANIA%')");
echo "Agents archivés dans ces subsites: {$archived_agents[0]['c']}\n";
