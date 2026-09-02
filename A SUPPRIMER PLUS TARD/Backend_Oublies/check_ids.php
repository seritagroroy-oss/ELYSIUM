<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/data/database.sqlite');
$stmt = $sqlite->query("SELECT * FROM agent_schedules");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    if (strpos($row['target_subsite_id'], 'itc_costume') !== false) {
        echo "Found schedule target_subsite_id: " . $row['target_subsite_id'] . "\n";
    }
}
$stmt = $sqlite->query("SELECT id, name FROM subsites WHERE site_id = 'site_itc'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    if (strpos($row['id'], 'itc_costume') !== false) {
        echo "Found subsite id: " . $row['id'] . "\n";
    }
}
