<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT * FROM settings WHERE key_name = 'max_initialized_period'")->fetch();
print_r($res);
