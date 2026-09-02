<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->query("SELECT id, name, subsite_id FROM agents WHERE subsite_id IN ('sub_1782830065_5830', 'sub_1783962421_7095')");
echo json_encode($stmt);
?>
