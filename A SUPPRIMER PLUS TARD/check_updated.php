<?php
require_once 'backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT created_at FROM archives_pointage WHERE id = 106");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo "CREATED AT: " . $row['created_at'] . "\n";
