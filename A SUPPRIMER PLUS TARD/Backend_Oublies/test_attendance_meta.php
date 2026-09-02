<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT agent_id, metadata FROM attendance WHERE metadata IS NOT NULL AND metadata != '' LIMIT 10");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
