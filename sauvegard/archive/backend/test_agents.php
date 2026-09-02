<?php
require_once __DIR__ . '/database.php';
$db = getDb();
if ($db instanceof ElysiumPdoDb) {
    $stmt = $db->prepare("DESCRIBE agents");
    $stmt->execute();
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
    $stmt = $db->prepare("PRAGMA table_info(agents)");
    $stmt->execute();
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
echo json_encode($cols, JSON_PRETTY_PRINT);
