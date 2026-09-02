<?php
require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

$company_id = 'comp_cf66d02f';
$next_period = '2026-09';

echo "Before update:\n";
echo getServiceDataSql($company_id, 'max_initialized_period', 'NULL') . "\n";

echo "Updating...\n";
setServiceDataSql($company_id, 'max_initialized_period', $next_period);

echo "After update:\n";
echo getServiceDataSql($company_id, 'max_initialized_period', 'NULL') . "\n";
