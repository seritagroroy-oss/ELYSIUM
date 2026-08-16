<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE data_key = 'functions' AND service_id = 'company::comp_cf66d02f'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    $funcs = json_decode($row['data_value'], true);
    echo "Total: " . count($funcs) . "\n\n";
    foreach ($funcs as $i => $f) {
        // Show hex of ID to detect invisible spaces
        $hex = bin2hex($f['id']);
        echo ($i+1) . ". ID: '" . $f['id'] . "' [hex: $hex] | Name: '" . ($f['name'] ?? '') . "'\n";
    }
}
