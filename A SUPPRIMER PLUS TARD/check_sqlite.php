<?php
$db = new SQLite3('C:/laragon/www/pontage/backend/data/database.sqlite');
$stmt = $db->prepare("SELECT id, name, company_id, subsite_id, archived_period FROM agents WHERE name LIKE ?");
$stmt->bindValue(1, '%KEKELY%');
$res = $stmt->execute();
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    echo "Found in SQLite: {$row['name']} (ID: {$row['id']}) - Company: {$row['company_id']}, Subsite: {$row['subsite_id']}, Archived: {$row['archived_period']}\n";
}
