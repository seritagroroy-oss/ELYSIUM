<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM users WHERE name LIKE '%KOFFI%'");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($users)) {
    $stmt = $sqlite->query("SELECT * FROM admin_users WHERE name LIKE '%KOFFI%'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
echo json_encode($users, JSON_PRETTY_PRINT);
?>
