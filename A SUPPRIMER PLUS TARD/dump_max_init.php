<?php
// Mock session
session_start();
$_SESSION['user_id'] = 'admin@example.com';
$_SESSION['user_role'] = 'super_admin';
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['service_id'] = 'SECURITEX SA';

require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

$companyKey = resolveCurrentCompanyIdSql();
$serviceKey = $_SESSION['service_id'];

echo "CompanyKey: " . $companyKey . "<br/>";
echo "ServiceKey: " . $serviceKey . "<br/>";

$maxInitCompany = getServiceDataSql($companyKey, 'max_initialized_period', 'NULL');
$maxInitService = getServiceDataSql($serviceKey, 'max_initialized_period', 'NULL');

echo "Max Init (Company): " . $maxInitCompany . "<br/>";
echo "Max Init (Service): " . $maxInitService . "<br/>";
