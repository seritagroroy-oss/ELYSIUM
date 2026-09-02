<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, company_id, service_id FROM sites");
echo json_encode($stmt);
?>
