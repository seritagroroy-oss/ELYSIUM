<?php
require 'backend/database.php';
$db = getDb();
$rows = $db->query("SELECT id, name, `function` FROM agents WHERE id IN ('ag_1786713237_ag_1786712862_6a7d24af5ec9d', 'ag_1786554502_ag_1786553512_ag_1786553446_ag_1786535926_ag_1786533626_6a6c635c3627d')");
print_r($rows);
