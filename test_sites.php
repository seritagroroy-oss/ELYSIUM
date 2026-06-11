<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query('SELECT id, name, company_id, service_id FROM sites LIMIT 10');
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
