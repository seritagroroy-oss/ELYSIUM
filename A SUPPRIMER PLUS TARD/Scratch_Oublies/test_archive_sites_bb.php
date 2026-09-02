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
$_POST["action"] = "archive_all_sites";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "archive_all_sites";
$data = ["period" => "2026-10", "siteOrder" => []];

ob_start();
require __DIR__ . "/../backend/modules/sites_v2.php";
$output = ob_get_clean();
echo "Archive Sites Output BB: " . $output . "\n";

