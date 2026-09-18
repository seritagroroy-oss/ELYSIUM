<?php
require 'backend/database.php';
$db = getDb();
$rows = $db->query('SELECT * FROM system_notifications');
print_r($rows);
