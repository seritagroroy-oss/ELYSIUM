<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query("SELECT id, name, site_id FROM subsites LIMIT 5");
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
