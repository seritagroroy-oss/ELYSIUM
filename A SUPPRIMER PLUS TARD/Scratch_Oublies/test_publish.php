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
$_GET["action"] = "get_salaries";
$_GET["period"] = "2026-10";

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$action = "get_salaries";
$data = ["period" => "2026-10"];

try {
    ob_start();
    require __DIR__ . "/../backend/modules/salaries.php";
    $output = ob_get_clean();
    $jsonStart = strpos($output, "[{");
    if ($jsonStart !== false) {
        echo "Salaries Output: " . substr($output, $jsonStart, 100) . "...\n";
    } else {
        $jsonStartObj = strpos($output, "{");
        if ($jsonStartObj !== false) {
            echo "Salaries Output (OBJ): " . substr($output, $jsonStartObj, 100) . "...\n";
        } else {
            echo "Salaries Output: " . $output;
        }
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
