<?php
require '../backend/database.php';
$sqlite = getDb();
$rows = $sqlite->query("SELECT id, name, profile_data FROM agents WHERE name LIKE '%d%' LIMIT 5");
foreach ($rows as $row) {
    echo "ID: " . $row['id'] . "\nName: " . $row['name'] . "\nProfile: " . $row['profile_data'] . "\n\n";
}
?>
