<?php
$db = new PDO('sqlite:' . __DIR__ . '/database.sqlite');

// Schema
$tables = $db->query('SELECT name FROM sqlite_master WHERE type="table"')->fetchAll(PDO::FETCH_COLUMN);
foreach($tables as $t) {
    echo $t . ': ';
    $info = $db->query('PRAGMA table_info(' . $t . ')')->fetchAll(PDO::FETCH_ASSOC);
    echo implode(', ', array_column($info, 'name')) . "\n";
}

// Archives
echo "\n-- ARCHIVES --\n";
$rows = $db->query("SELECT id, service_id, company_id, period FROM archives WHERE id NOT LIKE 'payroll_%' ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach($rows as $r) {
    echo "ID: {$r['id']} | Period: {$r['period']} | Service: {$r['service_id']}\n";
    $stmt = $db->prepare("SELECT data FROM archives WHERE id=?");
    $stmt->execute([$r['id']]);
    $data = $stmt->fetchColumn();
    $dec = json_decode($data, true);
    echo "  sites count: " . count($dec['sites'] ?? []) . "\n";
    foreach(($dec['sites'] ?? []) as $site) {
        echo "    Site: " . $site['name'] . " | subsites: " . count($site['subsites'] ?? []) . "\n";
        foreach(($site['subsites'] ?? []) as $sub) {
            echo "      Sub: " . $sub['name'] . " | agents: " . count($sub['agents'] ?? []) . "\n";
        }
    }
}

// Presence
echo "\n-- ATTENDANCE (10 dernieres) --\n";
$rows = $db->query("SELECT agent_id, date, period, service_id FROM attendance ORDER BY rowid DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach($rows as $r) {
    echo "Agent: {$r['agent_id']} | Date: {$r['date']} | Period: {$r['period']} | Service: {$r['service_id']}\n";
}

// Sites
echo "\n-- SITES --\n";
$rows = $db->query("SELECT id, name, service_id FROM sites LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach($rows as $r) {
    echo "Site: {$r['name']} | id: {$r['id']} | service: {$r['service_id']}\n";
}
