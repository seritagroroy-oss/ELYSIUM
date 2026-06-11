<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT count(*) as c FROM attendance WHERE period LIKE '2026-%'");
print_r($stmt);
