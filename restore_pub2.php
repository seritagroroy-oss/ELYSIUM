<?php
require "backend/database.php";

$period = '2026-08';
$sqlite = getDb();
$company = 'comp_cf66d02f';

try {
    // 1. Re-add to published_periods
    $stmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
    $stmt->execute([$company]);
    $row = $stmt->fetch();

    if ($row) {
        $val = json_decode($row['data_value'], true);
        if (is_array($val) && !in_array($period, $val)) {
            $val[] = $period;
            $update = $sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'published_periods'");
            $update->execute([json_encode(array_values($val)), $company]);
            echo "Re-added $period to published_periods for $company.<br/>\n";
        } else {
            echo "Period already in published_periods.<br/>\n";
        }
    } else {
        // Create if it doesn't exist
        $val = [$period];
        $insert = $sqlite->prepare("INSERT INTO service_data (service_id, data_key, data_value) VALUES (?, 'published_periods', ?)");
        $insert->execute([$company, json_encode($val)]);
        echo "Created published_periods for $company and added $period.<br/>\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
