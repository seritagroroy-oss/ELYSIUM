<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT * FROM service_data WHERE data_key = 'published_periods' AND service_id LIKE 'svc_%'");
$stmt->execute();
$published_svc = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($published_svc, JSON_PRETTY_PRINT);
?>
