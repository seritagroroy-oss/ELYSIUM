<?php
require 'backend/database.php';
$db = getDb();
$stmt = $db->prepare('SELECT has_sp FROM agents LIMIT 1');
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($results);
