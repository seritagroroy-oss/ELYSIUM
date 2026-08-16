<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$svc = $sqlite->query("SELECT * FROM services WHERE id = 'svc_1782477157_571'");
echo json_encode($svc, JSON_PRETTY_PRINT);
?>
