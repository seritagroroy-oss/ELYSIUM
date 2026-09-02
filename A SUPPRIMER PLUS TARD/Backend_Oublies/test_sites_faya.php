<?php
require_once 'database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name FROM sites WHERE name LIKE '%EXTRA SUR SITE%'");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($sites);
