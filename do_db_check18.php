<?php
session_start();
require __DIR__ . '/backend/database.php';
require __DIR__ . '/backend/core/functions.php';

// Mock KOFFI's session
$_SESSION['user_id'] = 'adminelysiumsecuritex@gmail.com';
$_SESSION['user_role'] = 'admin';
$_SESSION['service_id'] = 'svc_1782477157_571';
$_SESSION['company_id'] = 'comp_cf66d02f';

$serviceKey = $_SESSION['service_id'];
$companyKey = resolveCurrentCompanyIdSql();
$scope = 'company';
$target_val = ($scope === 'company') ? $companyKey : $serviceKey;
$target_col = ($scope === 'company') ? 'company_id' : 'service_id';

$published = getServiceDataSql($target_val, 'published_periods', []);
if ($scope === 'company' && empty($published)) {
    $published = getServiceDataSql($serviceKey, 'published_periods', []);
}

echo json_encode([
    'companyKey' => $companyKey,
    'target_val' => $target_val,
    'published' => $published,
], JSON_PRETTY_PRINT);
?>
