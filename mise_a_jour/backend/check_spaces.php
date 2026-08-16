<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);
require 'database.php';
$sqlite = new PDO('sqlite:' . $path);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$agent_id = '6a47422a78e86';
$schedules = $sqlite->query("SELECT * FROM agent_schedules WHERE agent_id = '$agent_id'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($schedules as $s) {
    echo "ID: {$s['id']}, target_subsite_id: '" . $s['target_subsite_id'] . "' (length: " . strlen($s['target_subsite_id']) . ")\n";
}

$subsites = $sqlite->query("SELECT id FROM subsites WHERE site_id = '1783054813_799'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($subsites as $s) {
    echo "Subsite ID: '" . $s['id'] . "' (length: " . strlen($s['id']) . ")\n";
}
