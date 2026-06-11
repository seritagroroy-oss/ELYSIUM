<?php
$db = new SQLite3('backend/elysium.db');
$res = $db->query('SELECT agent_id, period, date FROM attendance LIMIT 5');
while($r = $res->fetchArray(SQLITE3_ASSOC)) print_r($r);
$res2 = $db->query('PRAGMA table_info(attendance)');
while($r = $res2->fetchArray(SQLITE3_ASSOC)) print_r($r['name'] . ' ');
