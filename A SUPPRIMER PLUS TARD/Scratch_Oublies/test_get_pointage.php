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
$_GET["action"] = "get_pointage_for_archive";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "get_pointage_for_archive";
$data = [];
$_GET["period"] = "2026-10";

try {
    ob_start();
    require __DIR__ . "/../backend/modules/pointage.php";
    $output = ob_get_clean();
    echo "Get Pointage Output: " . substr($output, 0, 100) . "\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
