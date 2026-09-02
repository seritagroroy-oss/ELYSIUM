<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_cf66d02f';
$action = 'debug_dddd';
$_SERVER['REQUEST_METHOD'] = 'GET';

require "backend/database.php";
require "backend/core/functions.php";

$companyKey = 'comp_cf66d02f';
$period = '2026-08';

$sqlite = getDb();

// 1. Remove from published_periods
$published = getServiceDataSql($companyKey, 'published_periods', []);
if (($key = array_search($period, $published)) !== false) {
    unset($published[$key]);
    $published = array_values($published);
    setServiceDataSql($companyKey, 'published_periods', $published);
    echo "Removed $period from published_periods.<br/>\n";
}

// 2. Delete from payroll_snapshots
$stmt = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$companyKey, $period]);
echo "Deleted $period from payroll_snapshots. Rows affected: " . $stmt->rowCount() . "<br/>\n";

// 3. comp_0c67bb25
$companyKey2 = 'comp_0c67bb25';
$published2 = getServiceDataSql($companyKey2, 'published_periods', []);
if (($key = array_search($period, $published2)) !== false) {
    unset($published2[$key]);
    $published2 = array_values($published2);
    setServiceDataSql($companyKey2, 'published_periods', $published2);
    echo "Removed $period from published_periods (comp_0c67bb25).<br/>\n";
}
$stmt = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$companyKey2, $period]);
echo "Deleted $period from payroll_snapshots (comp_0c67bb25). Rows affected: " . $stmt->rowCount() . "<br/>\n";

// Also clear SQLite fallback cache just to be absolutely sure
$stmt = $sqlite->prepare("DELETE FROM archives WHERE id = ?");
$stmt->execute(['payroll_' . $period]);
echo "Cleared archives backup.\n";
?>
