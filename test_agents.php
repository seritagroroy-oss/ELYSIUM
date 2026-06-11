<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query('SELECT id, name, subsite_id, service_id, company_id FROM agents LIMIT 5');
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
