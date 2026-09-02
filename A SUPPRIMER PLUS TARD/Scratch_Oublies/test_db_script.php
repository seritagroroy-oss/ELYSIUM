<?php
require_once __DIR__ . '/../backend/database.php';
$db = getDb();
$res = $db->query("SELECT service_id, data_key, LEFT(data_value, 200) FROM service_data WHERE data_key = 'published_periods' LIMIT 10");
var_dump($res);
