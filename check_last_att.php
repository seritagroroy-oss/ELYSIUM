<?php
require 'backend/database.php';
$db = getDb();
$results = $db->query("SELECT * FROM attendance ORDER BY id DESC LIMIT 20");
print_r($results);
