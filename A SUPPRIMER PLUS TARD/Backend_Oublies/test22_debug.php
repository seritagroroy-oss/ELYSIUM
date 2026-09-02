<?php
$_SERVER['DOCUMENT_ROOT'] = 'c:/laragon/www';
$_REQUEST['action'] = 'SECRET_FIX';
$action = 'SECRET_FIX';

require 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();

// Find YEO's agent_id
$stmt = $sqlite->query("SELECT a.agent_id, ag.name, a.period FROM attendance a JOIN agents ag ON a.agent_id = ag.id WHERE ag.name LIKE '%YEO YANOUC%' ORDER BY a.period DESC LIMIT 1");
$row = $stmt[0];
$agent_id = $row['agent_id'];
$period = $row['period'];

// In attendance table, site is not saved directly, but we can group by service_id
$stmt = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ? AND period = ?");
$stmt->execute([$agent_id, $period]);
$att = $stmt->fetchAll();

echo "<pre>";
print_r($att);
echo "</pre>";

// wait, the previous test21 printed attendance, but ALL of them had `service_id` => `svc_52f7a282`!
// Which is the EXTRAS BUREAU!
// Where is the attendance for the original site `LDF - ABIDJAN MALL`?
// Maybe the user overwrote it? Let's check `mutations` table!
$stmt2 = $sqlite->prepare("SELECT * FROM agents_mutations WHERE agent_id = ?");
$stmt2->execute([$agent_id]);
echo "Mutations:<br><pre>";
print_r($stmt2->fetchAll());
echo "</pre>";
