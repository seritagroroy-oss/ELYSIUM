<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE data_key = 'functions' AND service_id = 'company::comp_cf66d02f'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    $funcs = json_decode($row['data_value'], true);
    foreach ($funcs as $f) {
        echo "ID: '" . $f['id'] . "' | Name: '" . ($f['name'] ?? '') . "'\n";
    }
}
