<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, site_id FROM subsites WHERE name LIKE '%MALL%'");
echo json_encode($stmt);
?>
