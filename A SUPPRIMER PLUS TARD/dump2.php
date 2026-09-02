<?php
require_once 'backend/config/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM supplementaires_externes LIMIT 10");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
