<?php
require_once 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id FROM agents WHERE name = 'dddd'");
$stmt->execute();
$agent = $stmt->fetch();
if (!$agent) {
    echo "Agent dddd not found.";
    exit;
}
$agent_id = $agent['id'];
$stmt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = '2042-10' ORDER BY date");
$stmt->execute([$agent_id]);
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Pointages for dddd (ID: $agent_id):\n";
print_r($res);
?>
