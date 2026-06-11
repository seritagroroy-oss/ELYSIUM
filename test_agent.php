<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, name, subsite_id FROM agents WHERE service_id = 'svc_1780068297_395'");
print_r($res);
