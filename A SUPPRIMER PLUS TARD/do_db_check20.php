<?php
header('Content-Type: application/json; charset=UTF-8');
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

try {
    $stmt = $sqlite->prepare("SELECT id, period, company_id, archived_date FROM archives_pointage ORDER BY period DESC");
    $stmt->execute();
    $archives = $stmt->fetchAll(PDO::FETCH_ASSOC);
    die(json_encode(["archives" => $archives]));
} catch (Exception $e) {
    die(json_encode(["error" => $e->getMessage()]));
}
?>
