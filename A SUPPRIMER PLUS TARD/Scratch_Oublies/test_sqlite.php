<?php
$db = new PDO('sqlite::memory:');
$stmt = $db->query("SELECT CASE WHEN '' <= '2026-08-20' THEN 'YES' ELSE 'NO' END");
echo "Is empty string <= date? " . $stmt->fetchColumn() . "\n";
