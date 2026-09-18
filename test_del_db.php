<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM pointage_delegations WHERE delegated_to = 'comptara@gmail.com' OR delegated_to = '458'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
