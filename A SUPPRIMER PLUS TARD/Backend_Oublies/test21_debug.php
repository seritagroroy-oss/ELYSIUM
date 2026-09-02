<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';

require 'c:/laragon/www/pontage/backend/database.php';
require 'c:/laragon/www/pontage/backend/core/functions.php';

$sqlite = getDb();

// Find YEO's agent_id
$stmt = $sqlite->query("SELECT a.agent_id, ag.name, a.period FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE ag.name LIKE '%YEO YANOUC%' ORDER BY a.period DESC LIMIT 1");
$row = $stmt[0];

$agent_id = $row['agent_id'];
$period = $row['period'];

echo "Agent ID: $agent_id <br>";
echo "Period: $period <br>";

// Get all attendance rows
$stmt = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ? AND period = ?");
$stmt->execute([$agent_id, $period]);
$att = $stmt->fetchAll();

echo "<pre>";
print_r($att);
echo "</pre>";

