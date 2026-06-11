<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, name, company_id FROM services WHERE name LIKE '%comptabilite%'");
print_r($res);

foreach ($res as $row) {
    if ($row['company_id'] !== 'comp_default_1') {
        $sqlite->exec("UPDATE services SET company_id = 'comp_default_1' WHERE id = '" . $row['id'] . "'");
        echo "Updated company_id for service " . $row['name'] . "\n";
    }
}
