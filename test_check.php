<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT * FROM pointage_delegations");
print_r($stmt);
