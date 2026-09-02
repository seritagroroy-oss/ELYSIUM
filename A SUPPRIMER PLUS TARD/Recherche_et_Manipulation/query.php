<?php
require 'backend/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, `function`, salary, site_id, zone_name FROM agents WHERE name LIKE '%KOFFI SOLANGE%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
