<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['user_role'] = 'super_admin';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'svc_default_1';

require_once 'core/functions.php';
$sqlite = getDb();
$sqlite->exec("UPDATE service_data SET value = '[]' WHERE key = 'published_periods'");
$sqlite->exec("UPDATE service_data SET value = '[]' WHERE key = 'max_initialized_period'");
$sqlite->exec("DELETE FROM archives WHERE id LIKE 'payroll_%'");
echo "Unpublished successfully.\n";
