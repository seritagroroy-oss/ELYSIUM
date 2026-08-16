<?php
require 'core/functions.php';
require 'database.php';
$db = getDb();
$res = $db->query("SELECT * FROM attendance WHERE status LIKE 'Suppl%' ORDER BY id DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('att_log.txt', print_r($res, true));
echo "Done";
