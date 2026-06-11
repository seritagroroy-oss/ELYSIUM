<?php
$db = new SQLite3('database.sqlite');

// Check service_data schema
$result = $db->query("SELECT sql FROM sqlite_master WHERE name='service_data'");
$row = $result->fetchArray(SQLITE3_ASSOC);
echo "service_data schema:\n";
echo ($row['sql'] ?? 'TABLE NOT FOUND') . "\n\n";

// Show functions data
$result2 = $db->query("SELECT service_id, data_key, substr(data_value,1,300) as data_value FROM service_data WHERE data_key='functions' LIMIT 20");
echo "All functions rows in service_data:\n";
$found = false;
while($r = $result2->fetchArray(SQLITE3_ASSOC)) {
    $found = true;
    echo "  service_id=" . $r['service_id'] . " => " . $r['data_value'] . "\n";
}
if(!$found) echo "  (none found)\n";
