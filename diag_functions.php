<?php
require_once __DIR__ . '/backend/database.php';

$db = getDb();

echo "=== service_data WHERE data_key='functions' ===\n";
$rows = $db->query("SELECT service_id, data_key, SUBSTR(data_value,1,300) as val FROM service_data WHERE data_key='functions'");
foreach ($rows as $row) {
    echo "service_id: " . $row['service_id'] . "\n";
    echo "val: " . $row['val'] . "\n\n";
}

echo "\n=== Tous les service_data (service_id, data_key) ===\n";
$rows2 = $db->query("SELECT service_id, data_key FROM service_data ORDER BY service_id, data_key");
foreach ($rows2 as $r) {
    echo "service_id=" . $r['service_id'] . ", key=" . $r['data_key'] . "\n";
}

echo "\n=== Utilisateurs (email, service_id, company_id) ===\n";
$rows3 = $db->query("SELECT email, service_id, company_id FROM users ORDER BY company_id");
foreach ($rows3 as $r) {
    echo "email=" . $r['email'] . ", service_id=" . $r['service_id'] . ", company_id=" . $r['company_id'] . "\n";
}
