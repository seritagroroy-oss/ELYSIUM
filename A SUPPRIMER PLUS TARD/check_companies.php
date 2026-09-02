<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$agents = $sqlite->query("SELECT company_id, subsite_id, COUNT(*) as cnt FROM agents WHERE subsite_id LIKE '%itc%' GROUP BY company_id, subsite_id");
foreach($agents as $a) {
    echo "Company: {$a['company_id']}, Subsite: {$a['subsite_id']}, Count: {$a['cnt']}\n";
}
