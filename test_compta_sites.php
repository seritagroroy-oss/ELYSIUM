<?php
$db = new SQLite3('backend/elysium.db');
$stmt2 = $db->prepare("SELECT id, name, company_id FROM sites WHERE company_id = 'comp_default_1'");
$res = $stmt2->execute();
$sites = [];
while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
    $sites[] = $row;
}
print_r($sites);
