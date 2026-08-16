<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
// Check comp_0d73e8b0 and company::comp_0d73e8b0 for example, but let's check the current user's company functions
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$duplicates = [];
foreach ($rows as $row) {
    $funcs = json_decode($row['data_value'], true);
    if (is_array($funcs)) {
        $ids = [];
        foreach ($funcs as $f) {
            $id = trim(strtoupper($f['id'] ?? ''));
            if (isset($ids[$id])) {
                $duplicates[$row['service_id']][] = $id;
            } else {
                $ids[$id] = true;
            }
        }
    }
}
echo json_encode($duplicates, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
