<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$users = $sqlite->query("SELECT * FROM users WHERE name LIKE '%KOFFI%'");

if (empty($users)) {
    $users = $sqlite->query("SELECT * FROM admin_users WHERE name LIKE '%KOFFI%'");
}
echo json_encode($users, JSON_PRETTY_PRINT);
?>
