<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, service_id, company_id FROM archives");
print_r($res);
