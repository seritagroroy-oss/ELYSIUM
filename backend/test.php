<?php
$action = 'login';
require 'database.php';
require 'core/functions.php';
$sqlite = getDb();
$snapshot = generateSalariesData($sqlite, '2028-08', 'comp_default_1', 'company_id', 'comp_default_1', null);
foreach($snapshot as $s) {
    if($s['name'] === 'JUNIOR' || $s['name'] === 'd' || $s['name'] === 'AAA') {
        echo $s['name'] . " Base: " . $s['base'] . "\n";
        echo $s['name'] . " Gains: " . $s['gains'] . "\n";
        if (isset($s['sp_details'])) {
            echo $s['name'] . " SP Details: " . json_encode($s['sp_details']) . "\n";
        }
    }
}
