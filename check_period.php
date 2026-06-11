<?php
$db = new SQLite3('backend/elysium.db');
$count = $db->querySingle('SELECT COUNT(*) FROM attendance WHERE period IS NULL');
echo "Null periods: " . $count . "\n";
$total = $db->querySingle('SELECT COUNT(*) FROM attendance');
echo "Total records: " . $total . "\n";
