<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT id, name, service_id, company_id FROM sites");
foreach ($res as $r) {
    print_r($r);
}
