<?php
require_once "mise_a_jour/backend/core/functions.php";
$stmt = $pdo->prepare("SELECT id, name, is_clone, days_consumed_by_origin, profile_data FROM agents WHERE name IN ('dddd', 'gt')");
$stmt->execute();
$res = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($res, JSON_PRETTY_PRINT);
