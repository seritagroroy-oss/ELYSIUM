<?php
require "backend/database.php";

$db = getDb();
$company = 'comp_cf66d02f';
$period = '2026-08';

echo "Before delete:<br>";
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company, $period]);
$row = $stmt->fetch();
echo "Count: " . $row['cnt'] . "<br>";

echo "Deleting...<br>";
$stmt = $db->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company, $period]);
echo "Rows deleted: " . $stmt->rowCount() . "<br>";

echo "After delete:<br>";
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company, $period]);
$row = $stmt->fetch();
echo "Count: " . $row['cnt'] . "<br>";

// Clean published_periods correctly using service_id for MySQL service_data table
$stmt = $db->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
$stmt->execute([$company]);
$row = $stmt->fetch();
if ($row) {
    $published = json_decode($row['data_value'], true);
    if (is_array($published) && in_array($period, $published)) {
        $published = array_values(array_filter($published, fn($p) => $p !== $period));
        $update = $db->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'published_periods'");
        $update->execute([json_encode($published), $company]);
        echo "Cleaned published_periods.<br>";
    } else {
        echo "Period not in published_periods.<br>";
    }
} else {
    echo "No published_periods found.<br>";
}
?>
