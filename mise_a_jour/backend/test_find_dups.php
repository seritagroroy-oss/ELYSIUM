<?php
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$allDuplicates = [];
foreach ($rows as $row) {
    $funcs = json_decode($row['data_value'], true);
    if (is_array($funcs)) {
        $seen = [];
        $dups = [];
        foreach ($funcs as $f) {
            $id = $f['id'] ?? '';
            // normalize space
            $id_norm = trim(strtoupper($id));
            if (isset($seen[$id_norm])) {
                $dups[] = $id_norm;
            } else {
                $seen[$id_norm] = true;
            }
        }
        if (!empty($dups)) {
            $allDuplicates[$row['service_id']] = $dups;
        }
    }
}
echo json_encode($allDuplicates, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
