<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, source_module FROM sites WHERE id = '1783251655_675'");
echo json_encode($stmt);
?>
