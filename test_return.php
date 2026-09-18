<?php
$_SESSION['user_id'] = 'comptara@gmail.com';
require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$company_id   = 'comp_bb90668e';
$current_user = 'comptara@gmail.com';
$site_id = '1787707063_516';
$period = '2058-07';

$stmtCheck = $sqlite->prepare("SELECT * FROM pointage_delegations WHERE site_id = ? AND period = ? AND delegated_to = ? AND company_id = ? AND status = 'active'");
$stmtCheck->execute([$site_id, $period, $current_user, $company_id]);
$delegation = $stmtCheck->fetch(PDO::FETCH_ASSOC);

print_r($delegation);

if (!$delegation) {
    echo "Delegation not found!\n";
} else {
    echo "Delegation found! ID: " . $delegation['id'] . "\n";
}
