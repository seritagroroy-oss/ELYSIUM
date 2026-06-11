<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->query("SELECT service_id, count(*) as c FROM attendance WHERE period LIKE '2026-%' GROUP BY service_id");
print_r($stmt);
