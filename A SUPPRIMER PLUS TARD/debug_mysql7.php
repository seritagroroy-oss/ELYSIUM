<?php
require_once __DIR__ . '/backend/database.php';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['action'] = 'get_published_periods';
$_GET['scope'] = 'company';
$_SESSION['service_id'] = 'svc_71afaae6';
$_SESSION['user_id'] = 'test';
// Mock resolveCurrentCompanyIdSql if needed? 
// Wait, resolveCurrentCompanyIdSql will fail if we don't mock it?
// Let's just run getServiceDataSql
require_once __DIR__ . '/backend/core/functions.php';

$company_id = 'comp_a8b50b7e';
$published = getServiceDataSql($company_id, 'published_periods', []);
echo "direct getServiceDataSql:\n";
print_r($published);
