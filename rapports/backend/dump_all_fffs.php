<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);
require 'database.php';
$sqlite = new PDO('sqlite:' . $path);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $sqlite->prepare("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%FFF%'");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($agents as $a) {
    echo "ID: {$a['id']}, Name: {$a['name']}, Subsite: {$a['subsite_id']}\n";
    $schedules = $sqlite->query("SELECT * FROM agent_schedules WHERE agent_id = '{$a['id']}'")->fetchAll(PDO::FETCH_ASSOC);
    print_r($schedules);
}
