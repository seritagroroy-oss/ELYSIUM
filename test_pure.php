<?php
$db = new SQLite3('backend/elysium.db');
$db->enableExceptions(true);
$stmt = $db->prepare('INSERT INTO entreprises (id, name) VALUES (?, ?)');
$stmt->bindValue(1, 'comp_123', SQLITE3_TEXT);
$stmt->bindValue(2, 'Test', SQLITE3_TEXT);
$stmt->execute();
echo "Pure SQLite3 Success!";
