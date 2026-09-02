<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . "/../backend/database.php";
$sqlite = getDb();
$rows = $sqlite->query("SHOW COLUMNS FROM payroll_snapshots LIKE 'snapshot'");
echo "Type: " . $rows[0]["Type"] . "\n";

