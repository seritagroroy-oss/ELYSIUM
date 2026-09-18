<?php
require "backend/database.php";
$db = getDb();
$stmt = $db->query("SHOW CREATE TABLE reclamations");
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents("schema_create.txt", print_r($data, true));
?>
