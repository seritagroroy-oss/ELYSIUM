<?php
require_once "backend/database.php";
$db = getDbConnection();
$stmt = $db->prepare("SELECT id, name, is_clone, days_consumed_by_origin, profile_data FROM agents WHERE name IN ('dddd', 'gt')");
$stmt->execute();
$res = $stmt->fetchAll();
file_put_contents('debug.json', json_encode($res, JSON_PRETTY_PRINT));
echo "OK";
