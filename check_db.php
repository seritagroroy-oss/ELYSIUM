<?php
require "backend/database.php";
$db = getDb();
$stmt = $db->query("DESCRIBE reclamations");
print_r($stmt);
?>
