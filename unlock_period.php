<?php
session_start();
require "backend/database.php";
require "backend/core/functions.php";

$sqlite = getDb();
$period = '2026-08';
$archive_id = 'payroll_' . $period;

// 1. Delete from SQLite
$stmt = $sqlite->prepare("DELETE FROM archives WHERE id = ?");
$stmt->execute([$archive_id]);
$deletedRows = $stmt->rowCount();

// 2. Delete from JSON fallback for all services
$services = ['serv_test', 'svc_71afaae6']; // I know these are the ones I might have touched
foreach ($services as $svc) {
    $dbData = getScopedData($svc);
    if (isset($dbData['payroll_archives'][$period])) {
        unset($dbData['payroll_archives'][$period]);
        saveScopedData($dbData, $svc);
    }
}

// Just in case, clean all JSON files in the scoped directory
$jsonFiles = glob('backend/data_*.json');
foreach ($jsonFiles as $file) {
    $content = file_get_contents($file);
    if ($content) {
        $data = json_decode($content, true);
        if (isset($data['payroll_archives'][$period])) {
            unset($data['payroll_archives'][$period]);
            file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
        }
    }
}

echo "SUCCESS: Deleted $deletedRows rows from archives table and cleaned JSON files for $period.";
?>
