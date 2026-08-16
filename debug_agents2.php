<?php
require_once "backend/core/database.php";
$stmt = $pdo->prepare("SELECT id, name, is_clone, days_consumed_by_origin, profile_data FROM agents WHERE name IN ('dddd', 'gt')");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('debug.json', json_encode($res, JSON_PRETTY_PRINT));
echo "OK";
