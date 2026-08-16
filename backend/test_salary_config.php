<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT * FROM service_data WHERE data_key = 'salary_config'");
$stmt->execute();
$configs = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($configs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
