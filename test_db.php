<?php
require 'backend/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare('UPDATE sites SET name = ? WHERE id = ? AND service_id = ?');
$stmt->execute(['Test name', 'site_id', 'service_id']);
echo "OK\n";
