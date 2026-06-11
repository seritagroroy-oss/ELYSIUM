<?php
require 'backend/database.php';
$db = getDb();
$results = $db->query("SELECT * FROM attendance WHERE status LIKE 'M|%' LIMIT 5");
print_r($results);
