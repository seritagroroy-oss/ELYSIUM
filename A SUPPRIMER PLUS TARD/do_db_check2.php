<?php
$sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/pointage_v3.sqlite');
$stmt = $sqlite->query("SELECT * FROM admin_users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Admin Users:\n";
print_r($users);
?>
