<?php
require 'backend/database.php';
$sqlite = getDb();
$res = $sqlite->query("SELECT id, period, length(data) as size FROM archives WHERE company_id = 'comp_default_1'");
print_r($res);

$res2 = $sqlite->query("SELECT data FROM archives WHERE company_id = 'comp_default_1' ORDER BY id DESC LIMIT 1");
if ($res2 && count($res2) > 0) {
    $data = json_decode($res2[0]['data'], true);
    echo "Salaries count in archive: " . count($data['salaries'] ?? []) . "\n";
}
