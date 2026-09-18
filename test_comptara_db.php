<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT role, role_display_name, permissions FROM users WHERE email = 'comptara@gmail.com'");
$stmt->execute();
print_r($stmt->fetch(PDO::FETCH_ASSOC));
