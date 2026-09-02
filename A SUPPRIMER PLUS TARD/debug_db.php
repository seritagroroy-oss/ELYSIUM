<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT * FROM subsites ORDER BY created_at DESC LIMIT 10");
$stmt->execute();
$subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- RECENT SUBSITES ---\n";
print_r($subsites);

?>
