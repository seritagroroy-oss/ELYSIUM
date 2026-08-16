<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name FROM sites");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($sites, JSON_PRETTY_PRINT);
