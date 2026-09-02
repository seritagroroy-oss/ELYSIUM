<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/pointage_v3.sqlite');
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fetch companies
$stmt = $sqlite->query("SELECT * FROM companies");
$companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Fetch services
$stmt = $sqlite->query("SELECT * FROM services");
$services = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['companies' => $companies, 'services' => $services], JSON_PRETTY_PRINT);
?>
