<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots LIMIT 1");
$stmt->execute();
$row = $stmt->fetch();
if ($row) {
    $snap = json_decode($row['snapshot'], true);
    if (!empty($snap)) {
        $first = $snap[0];
        echo "Agent ID type: " . gettype($first['id']) . " value: " . $first['id'] . "\n";
        echo "Profile Data type: " . gettype($first['profile_data']) . "\n";
    }
}
?>
