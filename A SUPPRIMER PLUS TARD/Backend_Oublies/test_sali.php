<?php
require 'core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name FROM agents WHERE name LIKE '%SALI NO%'");
$stmt->execute();
$agent = $stmt->fetch();
$agent_id = $agent['id'];

$stmtAtt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? ORDER BY date ASC");
$stmtAtt->execute([$agent_id]);
$atts = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

echo "AGENT: " . $agent['name'] . "\n";
foreach($atts as $a) {
    echo $a['date'] . " [" . $a['shift_code'] . "]: " . $a['status'] . "\n";
}
