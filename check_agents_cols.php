<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("PRAGMA table_info(agents)");
print_r($res);
