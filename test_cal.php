<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query('SELECT * FROM calendar_progress');
print_r($res);
