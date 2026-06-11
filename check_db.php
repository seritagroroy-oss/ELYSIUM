<?php
$db = new SQLite3('backend/elysium.db');
$stmt = $db->query("SELECT id, service_id FROM sites WHERE id LIKE 'site_%'");
while ($row = $stmt->fetchArray(SQLITE3_ASSOC)) {
    print_r($row);
}
$stmt2 = $db->query("SELECT id, site_id FROM subsites WHERE id LIKE 'site_%'");
while ($row = $stmt2->fetchArray(SQLITE3_ASSOC)) {
    print_r($row);
}
