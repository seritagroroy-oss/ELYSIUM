<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'core/functions.php';

$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM agents WHERE name = 'UUU'");
$stmt->execute();
$uuu = $stmt->fetch();
if (!$uuu) die("UUU not found\n");

$stmt2 = $sqlite->prepare("SELECT * FROM agent_schedules WHERE agent_id = ?");
$stmt2->execute([$uuu['id']]);
$scheds = $stmt2->fetchAll();
foreach ($scheds as $s) {
    echo "Subsite target: " . $s['target_subsite_id'] . "\n";
}

$stmt3 = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = 'site_itc'");
$stmt3->execute();
$subsites = $stmt3->fetchAll();
foreach ($subsites as $s) {
    echo "Subsite ID in DB: " . $s['id'] . "\n";
}
