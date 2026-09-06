<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
$q = $db->query('SELECT * FROM subsites LIMIT 1');
print_r($q);
