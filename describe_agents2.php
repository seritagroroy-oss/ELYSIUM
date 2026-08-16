<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$cols = $sqlite->query("DESCRIBE agents");
echo json_encode(["columns" => array_column($cols, 'Field')]);
