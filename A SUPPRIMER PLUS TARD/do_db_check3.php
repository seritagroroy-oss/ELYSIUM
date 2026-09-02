<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
$stmt = $db->query("SELECT * FROM admin_users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($users);
?>
