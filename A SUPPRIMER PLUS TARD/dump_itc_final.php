<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();

echo "\n--- Agents in ITC ---\n";
$agents = $sqlite->query("SELECT id, name, subsite_id, company_id, archived_period FROM agents WHERE subsite_id LIKE '%itc%' OR name IN ('SSSS', 'DDDD')");
foreach($agents as $a) {
    echo "Agent: {$a['name']}, Subsite: {$a['subsite_id']}, Company: {$a['company_id']}, Archived: {$a['archived_period']}\n";
}
