<?php
require 'database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = (SELECT id FROM agents WHERE name = 'tygx' LIMIT 1)");
$stmt->execute();
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
