<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . "/../backend/database.php";
$sqlite = getDb();
$rows = $sqlite->query("SHOW COLUMNS FROM agents");
echo "Columns: ";
foreach ($rows as $row) {
    echo $row["Field"] . ", ";
}
echo "\n";

