<?php
require "backend/database.php";
$db = getDb();
$stmt = $db->query("DESCRIBE reclamations");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("schema.json", json_encode($data, JSON_PRETTY_PRINT));
?>
