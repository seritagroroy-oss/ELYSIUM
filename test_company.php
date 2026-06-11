<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query('SELECT email, company_id, service_id FROM users');
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
