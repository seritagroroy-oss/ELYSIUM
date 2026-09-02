<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
session_start();
$_SESSION["company_id"] = "comp_fa3c588a";
$_SESSION["service_id"] = "serv_verif";
$_SERVER["REQUEST_METHOD"] = "GET";
$_GET["action"] = "get_pointage_for_archive";
$_GET["period"] = "2026-10";

ob_start();
require __DIR__ . "/../backend/modules/pointage.php";
$output = ob_get_clean();
echo "Size: " . strlen($output) . " bytes\n";

