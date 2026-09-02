<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$agents = $sqlite->query("SELECT id, name, subsite_id, company_id, archived_period, exit_date FROM agents WHERE subsite_id LIKE '%itc%'");
foreach($agents as $a) {
    echo "Agent: {$a['name']}, Subsite: {$a['subsite_id']}, Exit Date: {$a['exit_date']}, Archived: {$a['archived_period']}\n";
}
