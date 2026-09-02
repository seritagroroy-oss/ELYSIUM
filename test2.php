<?php
require 'c:/laragon/www/pontage/backend/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT agent_id, date, shift_type, value FROM pointages p JOIN agents ag ON p.agent_id = ag.id WHERE ag.company_id = 'comp_cf66d02f' AND ag.name LIKE '%KONATE MOUSTAPHA%' ORDER BY p.date, p.shift_type");
$stmt->execute([]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
