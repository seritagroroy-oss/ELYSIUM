<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions' AND data_value LIKE '%SUP INT%'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    echo $row['service_id'] . ":\n";
    $funcs = json_decode($row['data_value'], true);
    foreach ($funcs as $f) {
        if (strpos($f['id'], 'SUP INT') !== false || strpos($f['name'], 'SUP INT') !== false) {
            echo "  ID: '" . $f['id'] . "' | Name: '" . $f['name'] . "'\n";
        }
    }
}
