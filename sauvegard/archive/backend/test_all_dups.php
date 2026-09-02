<?php
// Session-less check – list ALL functions rows and show all IDs
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $row) {
    $funcs = json_decode($row['data_value'], true);
    if (!is_array($funcs)) continue;
    
    // Find all IDs and count occurrences
    $idCounts = [];
    foreach ($funcs as $f) {
        $id = trim($f['id'] ?? '');
        $idCounts[$id] = ($idCounts[$id] ?? 0) + 1;
    }
    
    // Only show rows that have duplicates
    $dups = array_filter($idCounts, fn($c) => $c > 1);
    if (!empty($dups)) {
        echo $row['service_id'] . " — Duplicates: " . implode(', ', array_keys($dups)) . "\n";
        echo "  Total functions: " . count($funcs) . "\n";
    }
}

echo "\n---\nAll service_ids with functions:\n";
foreach ($rows as $row) {
    $funcs = json_decode($row['data_value'], true);
    echo $row['service_id'] . " (" . count($funcs ?? []) . " funcs)\n";
}
