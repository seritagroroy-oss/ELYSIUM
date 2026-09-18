<?php
require 'backend/database.php';
require 'utils.php';
require 'backend/core/functions.php';
$action = 'get_dashboard_init';
$_GET['period'] = '2058-07';
$_SESSION = [
    'user_id' => 458, // comptara@gmail.com
    'company_id' => 'comp_bb90668e',
    'service' => 'Comptabilité'
];
ob_start();
require 'backend/modules/pointage.php';
$output = ob_get_clean();
echo "OUTPUT: " . $output;
