<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT id, name FROM sites LIMIT 5");
print_r($stmt);
