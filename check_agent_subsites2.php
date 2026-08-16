<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%GOUESSE%' OR name LIKE '%DAGNOGO%'");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
