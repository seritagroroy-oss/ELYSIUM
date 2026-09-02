<?php
require_once 'core/config.php';
require_once 'core/functions.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE period = '2026-09'");
$stmt->execute();
$row = $stmt->fetch();
if ($row) {
    $data = json_decode($row['snapshot'], true);
    if ($data) {
        // Just print the first agent to see base, etc.
        print_r($data[0]);
    } else {
        echo "Snapshot is not valid JSON.";
    }
} else {
    echo "No snapshot found for 2026-09.";
}
?>
