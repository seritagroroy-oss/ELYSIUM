<?php
require "backend/database.php";
require "backend/core/archive_helper.php";
session_start();
$_SESSION["company_id"] = "comp_66a9f4fb0bc2b";
$_SESSION["service_id"] = "svc_1782477157_571";
$sqlite = getDb();
$period = "2026-08";

    $oldGetPeriod = $_GET["period"] ?? null;
    $oldAction = $GLOBALS["action"] ?? null;
    
    $_GET["period"] = $period;
    $GLOBALS["action"] = "get_pointage_for_archive";
    $action = "get_pointage_for_archive";
    
    ob_start();
    include __DIR__ . "/backend/modules/pointage.php";
    $pointageRaw = ob_get_clean();

    echo "RAW LENGTH: " . strlen($pointageRaw) . "\n";
    if (strlen($pointageRaw) > 0 && $pointageRaw[0] !== "{") {
        echo "NOT JSON: " . substr($pointageRaw, 0, 200) . "\n";
    }
    
    $decoded = json_decode($pointageRaw, true);
    if ($decoded === null) {
        echo "JSON DECODE ERROR: " . json_last_error_msg() . "\n";
    } else {
        echo "DECODE SUCCESS. Sites: " . count($decoded["sites"] ?? []) . "\n";
    }

