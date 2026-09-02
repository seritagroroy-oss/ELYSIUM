<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%DEFAULT%' OR name LIKE '%1783251655%'");
echo json_encode($stmt);
?>
