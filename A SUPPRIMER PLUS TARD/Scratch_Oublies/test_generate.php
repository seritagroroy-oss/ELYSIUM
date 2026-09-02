<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
session_start();
$_SESSION["user_id"] = 1;
$_SERVER["REQUEST_METHOD"] = "GET";
$_GET["action"] = "test_dates";
require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$sqlite = getDb();
$period = "2026-10"; // OCTOBRE 2026
$companyKey = "comp_fa3c588a";
$serviceKey = null;

$data = generateSalariesData($sqlite, $period, $companyKey, "company_id", $companyKey, $serviceKey);
var_dump("Generated salaries count: " . count($data));

