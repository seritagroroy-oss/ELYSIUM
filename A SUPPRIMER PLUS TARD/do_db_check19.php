<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$serviceKey = 'svc_1782477157_571';
$companyKey = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = ?");
$stmt->execute([$companyKey, 'published_periods']);
$row = $stmt->fetch();
$published = $row ? ($row['data_value'] ?? null) : null;
$published = $published ? json_decode($published, true) : [];

echo json_encode([
    'companyKey' => $companyKey,
    'published' => $published,
], JSON_PRETTY_PRINT);
?>
