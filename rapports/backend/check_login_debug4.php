<?php
require_once 'core/db.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT a.name, att.date, att.status FROM attendance att JOIN agents a ON att.agent_id = a.id WHERE a.name LIKE '%alice%' AND att.shift_code LIKE 'S%'");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
