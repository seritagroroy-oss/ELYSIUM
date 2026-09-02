<?php
$_GET['action'] = 'login';
$action = 'login';
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'admin';
$_SESSION['company_id'] = 'comp_1783032514';
require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$period = '2028-01';
$target_col = 'company_id';
$target_val = 'comp_1783032514';
$serviceKey = '';

$salaries = generateSalariesData($sqlite, $period, $target_val, $target_col, $target_val, $serviceKey);
$filtered = [];
foreach($salaries as $s) {
    if (stripos($s['name'], 'alice') !== false || stripos($s['name'], 'amour') !== false) {
        $filtered[] = $s;
    }
}
file_put_contents('salaries_out.json', json_encode($filtered, JSON_PRETTY_PRINT));
echo "OK";
?>
