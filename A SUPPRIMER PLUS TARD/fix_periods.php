<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_bb90668e';

// Load existing published periods
$stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
$stmt->execute([$company_id]);
$row = $stmt->fetchColumn();
$published = $row ? json_decode($row, true) : [];

if (!in_array('2047-05', $published)) {
    $published[] = '2047-05';
}
if (!in_array('2047-06', $published)) {
    $published[] = '2047-06';
}

$sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'published_periods'")
       ->execute([json_encode($published), $company_id]);

// Update max initialized period
$sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'max_initialized_period'")
       ->execute([json_encode('2047-06'), $company_id]);

echo "Fixed periods!\n";
