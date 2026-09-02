<?php
session_start();
$_SESSION['user_id'] = 1;
$_SERVER['HTTP_HOST'] = 'pontage.test';

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
$services = ['serv_test', 'svc_71afaae6', 'comp_cf66d02f', 'comp_0c67bb25', 'comp_a8b50b7e'];
foreach ($services as $svc) {
    // Just in case we used company_id or service_id as scope key
    $dbData = getScopedData($svc);
    if (isset($dbData['payroll_archives'][$period])) {
        unset($dbData['payroll_archives'][$period]);
        saveScopedData($dbData, $svc);
    }
}

// 3. Bruteforce clean all JSON files in the backend directory
$jsonFiles = glob('backend/data_*.json');
$cleans = 0;
foreach ($jsonFiles as $file) {
    $content = file_get_contents($file);
    if ($content) {
        $data = json_decode($content, true);
        if (isset($data['payroll_archives'][$period])) {
            unset($data['payroll_archives'][$period]);
            file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
            $cleans++;
        }
    }
}

echo "SUCCESS: Deleted $deletedRows rows from archives table and cleaned $cleans JSON files for $period.";
?>
