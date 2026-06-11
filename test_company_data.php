<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query("SELECT count(*) as c FROM sites WHERE company_id = 'comp_20837e85'");
print_r($res->fetchArray(SQLITE3_ASSOC));
$res = $db->query("SELECT count(*) as c FROM service_data WHERE service_id = 'comp_20837e85'");
print_r($res->fetchArray(SQLITE3_ASSOC));
