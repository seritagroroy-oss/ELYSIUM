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

require_once __DIR__ . "/../backend/database.php";
require_once __DIR__ . "/../backend/core/functions.php";

$sqlite = getDb();
$companyKey = "comp_bb90668e";
$published = getServiceDataSql($companyKey, "published_periods", []);

$clean_published = [];
foreach ($published as $p) {
    if ($p <= "2026-12") {
        $clean_published[] = $p;
    }
}

echo "Old count: " . count($published) . "\n";
echo "New count: " . count($clean_published) . "\n";
print_r($clean_published);

setServiceDataSql($companyKey, "published_periods", $clean_published);

