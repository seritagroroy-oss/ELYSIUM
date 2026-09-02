<?php
$mysql = new PDO('mysql:host=127.0.0.1;port=3306;dbname=elysium;charset=utf8', 'root', '');
$stmt = $mysql->query("SELECT * FROM service_data WHERE `key` = 'max_initialized_period'");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
