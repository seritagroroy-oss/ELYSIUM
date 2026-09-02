<?php
$db = new PDO('sqlite:C:/laragon/www/pontage/backend/data/database.sqlite');
$stmt = $db->query("SELECT profile_data FROM agents WHERE name = 'h'");
echo $stmt->fetchColumn();
