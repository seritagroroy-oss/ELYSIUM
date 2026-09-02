<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/pointage_v3.sqlite');
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $sqlite->query("SELECT * FROM services WHERE name LIKE '%SECURITEX%'");
$services = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($services, JSON_PRETTY_PRINT);
?>
