<?php
require __DIR__ . '/backend/database.php';
$db = getDb();
$q = $db->query('SELECT * FROM activity_logs');
print_r($q);
