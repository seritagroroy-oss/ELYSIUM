<?php
require_once __DIR__ . '/database.php';
$_SESSION['company_id'] = 'comp_91f2bf0b'; // Some company from previous test
$action = 'get_functions';
// We just need to load sites.php to see the output
ob_start();
include __DIR__ . '/modules/sites.php';
$out = ob_get_clean();
echo $out;
