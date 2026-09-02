<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT * FROM agents");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$funcs = [];
foreach ($rows as $row) {
    if (!empty($row['function'])) {
        $funcs[] = $row['function'];
    }
}
$funcs = array_values(array_unique($funcs));
echo json_encode($funcs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
