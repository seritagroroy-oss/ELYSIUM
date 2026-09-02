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

$_SERVER["REQUEST_METHOD"] = "POST";
$_POST["action"] = "publish_period";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "publish_period";
$data = ["period" => "2026-10"];

try {
    ob_start();
    require __DIR__ . "/../backend/modules/salaries.php";
    $output = ob_get_clean();
    echo "Publish Output: " . $output . "\n";
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
