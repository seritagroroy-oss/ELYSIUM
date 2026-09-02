<?php
if (file_exists(__DIR__ . '/backend/elysium.db')) {
    echo "elysium.db EXISTS!\n";
    $db = new SQLite3(__DIR__ . '/backend/elysium.db');
    $stmt = $db->prepare("SELECT id, name, company_id, subsite_id FROM agents WHERE name LIKE '%KEKELY%'");
    $res = $stmt->execute();
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        echo "Found in SQLite: {$row['name']} - {$row['company_id']}\n";
    }
} else {
    echo "elysium.db DOES NOT EXIST.\n";
}
