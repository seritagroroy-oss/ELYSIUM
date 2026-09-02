<?php
require_once __DIR__ . '/backend/core/functions.php';

$sqlite = getDb();
echo "--- SITE_CONTRACTS ---\n";
$stmt = $sqlite->query("SELECT * FROM site_contracts");
while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    var_dump($r);
}

echo "\n--- SITES ---\n";
$stmt2 = $sqlite->query("SELECT * FROM sites");
while ($r = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    var_dump($r);
}

echo "\n--- AGENTS & SUBSITES ---\n";
$stmt3 = $sqlite->query("SELECT a.id, a.name, a.function, s.name as subsite_name, si.name as site_name FROM agents a JOIN subsites s ON a.subsite_id = s.id JOIN sites si ON s.site_id = si.id");
while ($r = $stmt3->fetch(PDO::FETCH_ASSOC)) {
    var_dump($r);
}
