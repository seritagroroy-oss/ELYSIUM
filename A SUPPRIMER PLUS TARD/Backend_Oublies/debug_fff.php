<?php
$db = new PDO('sqlite:C:/laragon/www/pontage/backend/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT id, name FROM agents WHERE name LIKE '%FFF%' LIMIT 1");
$agent = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$agent) {
    echo "Agent FFF not found\n";
    exit;
}
echo "Agent found: " . $agent['id'] . " - " . $agent['name'] . "<br>\n";

$stmt = $db->prepare("SELECT date, period, status FROM attendance WHERE agent_id = ?");
$stmt->execute([$agent['id']]);
$all = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total attendance records for FFF: " . count($all) . "<br>\n";
foreach(array_slice($all, 0, 100) as $row) {
    echo $row['date'] . " | " . $row['period'] . " | " . $row['status'] . "<br>\n";
}
