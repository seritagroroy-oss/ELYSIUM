<?php
require_once 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name, subsite_id FROM agents WHERE name LIKE '%GOUESSE%' OR name LIKE '%DAGNOGO%'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
