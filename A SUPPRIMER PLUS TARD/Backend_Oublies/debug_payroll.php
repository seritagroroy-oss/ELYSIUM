<?php
require_once __DIR__ . '/core/db.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM agents LIMIT 5");
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "COMPANY ID: " . $agents[0]['company_id'] . "\n";
$stmt2 = $sqlite->query("SELECT COUNT(*) FROM agents");
echo "TOTAL AGENTS: " . $stmt2->fetchColumn() . "\n";
