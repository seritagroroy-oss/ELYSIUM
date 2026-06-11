<?php
$db = new SQLite3(__DIR__ . '/backend/elysium.db');

echo "=== USER: comptabilite-securitex@gmail.com ===\n";
$stmt = $db->prepare("SELECT email, role, service_id, company_id, permissions, workspace_type FROM users WHERE email = ?");
$stmt->bindValue(1, 'comptabilite-securitex@gmail.com', SQLITE3_TEXT);
$res = $stmt->execute();
$user = $res->fetchArray(SQLITE3_ASSOC);
if ($user) {
    echo "role: " . $user['role'] . "\n";
    echo "service_id: " . $user['service_id'] . "\n";
    echo "company_id: " . $user['company_id'] . "\n";
    echo "workspace_type: " . $user['workspace_type'] . "\n";
    echo "permissions: " . $user['permissions'] . "\n";
} else {
    echo "USER NOT FOUND\n";
}

echo "\n=== ALL service_data rows with data_key='functions' ===\n";
$res2 = $db->query("SELECT service_id, data_key, data_value FROM service_data WHERE data_key='functions'");
$found = false;
while ($r = $res2->fetchArray(SQLITE3_ASSOC)) {
    $found = true;
    echo "service_id=" . $r['service_id'] . " => " . substr($r['data_value'], 0, 200) . "\n";
}
if (!$found) echo "(aucune ligne trouvée)\n";

echo "\n=== ALL service_data rows ===\n";
$res3 = $db->query("SELECT service_id, data_key FROM service_data LIMIT 50");
while ($r = $res3->fetchArray(SQLITE3_ASSOC)) {
    echo "service_id=" . $r['service_id'] . ", key=" . $r['data_key'] . "\n";
}

echo "\n=== SERVICES in company of this user ===\n";
if ($user) {
    $stmt2 = $db->prepare("SELECT id, name, permissions FROM services WHERE company_id = ?");
    $stmt2->bindValue(1, $user['company_id'], SQLITE3_TEXT);
    $res4 = $stmt2->execute();
    while ($r = $res4->fetchArray(SQLITE3_ASSOC)) {
        echo "id=" . $r['id'] . ", name=" . $r['name'] . ", permissions=" . $r['permissions'] . "\n";
    }
}
