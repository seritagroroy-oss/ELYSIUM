<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$tables = $sqlite->query("SHOW TABLES");
foreach ($tables as $t) {
    echo $t[0] . "\n";
}
