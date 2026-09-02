<?php
require 'c:/laragon/www/pontage/backend/database.php';
$db = getDb();
$stmt = $db->prepare("PRAGMA table_info(attendance)");
$stmt->execute([]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
