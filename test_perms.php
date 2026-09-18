<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute(['comptara@gmail.com']);
print_r($stmt->fetch(PDO::FETCH_ASSOC));
