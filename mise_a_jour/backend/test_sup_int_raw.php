<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions' AND data_value LIKE '%SUP INT%'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$res = [];
foreach ($rows as $row) {
    $res[$row['service_id']] = json_decode($row['data_value'], true);
}
echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
