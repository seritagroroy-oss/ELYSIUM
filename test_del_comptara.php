<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT * FROM pointage_delegations WHERE delegated_to = ?");
$stmt->execute(['comptara@gmail.com']);
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
