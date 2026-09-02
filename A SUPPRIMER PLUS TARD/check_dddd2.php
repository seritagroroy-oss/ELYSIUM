<?php
require_once 'c:/laragon/www/pontage/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, created_at FROM agents WHERE name LIKE '%dddd%'");
$stmt->execute();
$agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Agents matching dddd:\n";
print_r($agents);
?>
