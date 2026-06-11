<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT * FROM service_data WHERE service_id = 'svc_20837e85_123'");
print_r($res);
