<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name FROM sites");
$sites = $stmt; // fetchAll is done by query() in ElysiumPdoDb
echo json_encode($sites);
?>
