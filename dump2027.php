<?php
$dbFile = __DIR__ . '/backend/elysium.db';
$sqlite = new PDO('sqlite:' . $dbFile);
$stmt = $sqlite->prepare("SELECT id, data FROM archives WHERE id LIKE 'payroll_2027-%'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($rows as $row) {
    $data = json_decode($row['data'], true);
    $result[] = [
        'id' => $row['id'],
        'sites_count' => count($data['sites'] ?? []),
        'salaries_count' => count($data['salaries'] ?? []),
        'sites_list' => array_column($data['sites'] ?? [], 'name'),
        'salaries_sites' => array_unique(array_column($data['salaries'] ?? [], 'site'))
    ];
}
echo json_encode($result, JSON_PRETTY_PRINT);
