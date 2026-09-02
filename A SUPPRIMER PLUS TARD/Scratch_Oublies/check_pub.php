<?php
require_once dirname(__DIR__) . '/backend/core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT data FROM service_data WHERE data_key = 'published_periods'");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['data'] . "\n";
}
