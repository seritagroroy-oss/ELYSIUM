<?php
require 'backend/database.php';
$db = getDb();
print_r($db->query('PRAGMA table_info(entreprises)'));
