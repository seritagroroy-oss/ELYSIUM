<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
session_start();
$_SESSION["company_id"] = "comp_fa3c588a";
$_SESSION["user_service"] = "Service Verification";
$_SESSION["service_id"] = "serv_verif";
$_SESSION["user_role"] = "admin";
$_SESSION["user_id"] = 1;
$_SESSION["csrf_token"] = "dummy";
$_SERVER["REQUEST_METHOD"] = "GET";
$_GET["action"] = "get_salaries";
$_GET["period"] = "2026-10";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "get_salaries";
$data = [];

try {
    ob_start();
    require __DIR__ . "/../backend/modules/salaries.php";
    $output = ob_get_clean();
    echo "Salaries Output Length: " . strlen($output) . "\n";
    echo "Salaries Output Start: " . substr($output, 0, 100) . "\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
