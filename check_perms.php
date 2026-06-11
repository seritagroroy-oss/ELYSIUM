<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT s.name, s.permissions FROM services s JOIN users u ON u.service_id = s.id WHERE u.email='comptabilite-securitex@gmail.com'");
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
