<?php
$path = __DIR__ . '/elysium.db';
define('SQLITE_FILE', $path);
require 'database.php';
$sqlite = new PDO('sqlite:' . $path);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$agent_id = '6a47422a78e86'; // wait, what is FFF's id?
$stmt = $sqlite->prepare("SELECT id FROM agents WHERE name LIKE '%FFF%' LIMIT 1");
$stmt->execute();
$id = $stmt->fetchColumn();
if ($id) {
    echo "FFF ID: $id\n";
    $schedules = $sqlite->query("SELECT * FROM agent_schedules WHERE agent_id = '$id'")->fetchAll(PDO::FETCH_ASSOC);
    print_r($schedules);
} else {
    echo "FFF not found";
}
