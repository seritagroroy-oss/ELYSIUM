<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
session_start();
$_SESSION["company_id"] = "comp_bb90668e";
$_SESSION["user_service"] = "Service";
$_SESSION["service_id"] = "serv_some";
$_SESSION["user_role"] = "admin";
$_SESSION["user_id"] = 1;
$_SERVER["REQUEST_METHOD"] = "POST";
$_POST["action"] = "publish_period";
$_POST["period"] = "2026-10";

ob_start();
require __DIR__ . "/../backend/api_new.php";
$output = ob_get_clean();
echo "API Output: " . $output . "\n";

