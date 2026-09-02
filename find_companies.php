<?php
require "backend/database.php";
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM companies");
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
?>
