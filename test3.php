<?php
require 'c:/laragon/www/pontage/backend/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT a.date, a.shift_code, a.status, s.name as site_name FROM attendance a JOIN agents ag ON a.agent_id = ag.id JOIN sites s ON ag.site_id = s.id WHERE ag.company_id = 'comp_cf66d02f' AND ag.name LIKE '%KONATE MOUSTAPHA%' ORDER BY a.date, a.shift_code");
$stmt->execute([]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
