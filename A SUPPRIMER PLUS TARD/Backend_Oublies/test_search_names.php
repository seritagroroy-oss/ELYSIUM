<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT service_id, data_key, SUBSTRING(data_value, 1, 100) as preview FROM service_data WHERE data_value LIKE '%Garde%' OR data_value LIKE '%Agent%'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
