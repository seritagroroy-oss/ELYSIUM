<?php
require_once __DIR__ . '/backend/core/functions.php';

$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM service_data WHERE key = 'max_initialized_period'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
