<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

// 1. Fetch published_periods
$stmt = $sqlite->prepare("SELECT * FROM service_data WHERE data_key = 'published_periods'");
$stmt->execute();
$published = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 2. Fetch archives
$stmt = $sqlite->prepare("SELECT id, service_id, company_id, period FROM archives");
$stmt->execute();
$archives = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 3. Fetch latest publication
$stmt = $sqlite->prepare("SELECT * FROM service_data WHERE data_key = 'latest_publication'");
$stmt->execute();
$latest = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'published' => $published,
    'archives' => $archives,
    'latest' => $latest
], JSON_PRETTY_PRINT);
?>
