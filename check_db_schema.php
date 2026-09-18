<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='reclamations'")->fetch();
echo $res['sql'];
