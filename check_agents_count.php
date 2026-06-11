<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT s.name as site_name, count(a.id) as agents_count FROM sites s LEFT JOIN subsites sub ON sub.site_id = s.id LEFT JOIN agents a ON a.subsite_id = sub.id WHERE s.company_id='comp_default_1' GROUP BY s.id");
print_r($res);
