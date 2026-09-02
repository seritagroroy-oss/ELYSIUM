<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
session_start();
$_SESSION["company_id"] = "comp_bb90668e";
$_SESSION["user_service"] = "Service";
$_SESSION["service_id"] = "serv_some";
$_SESSION["user_role"] = "admin";
$_SESSION["user_id"] = 1;
$_SERVER["REQUEST_METHOD"] = "GET";
$_GET["action"] = "get_pointage_for_archive";
$_GET["period"] = "2026-10";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "get_pointage_for_archive";
$data = [];

ob_start();
require __DIR__ . "/../backend/modules/pointage.php";
$output = ob_get_clean();
echo "Length: " . strlen($output) . "\n";
echo substr($output, 0, 100);

