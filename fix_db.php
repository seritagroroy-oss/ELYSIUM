<?php
require 'backend/database.php';
$sqlite = getDb();
$sqlite->exec("UPDATE attendance SET shift_code = 'J' WHERE shift_code IN ('24h', '48h', '72h') AND (status LIKE 'EXT%' OR status LIKE 'REL%')");
echo "Fixed shift_code for rotative extras/releves";
