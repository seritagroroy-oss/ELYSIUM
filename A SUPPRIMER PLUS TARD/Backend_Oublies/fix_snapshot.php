<?php
require_once 'core/config.php';
require_once 'core/functions.php';
$sqlite = getDb();
// For all periods in archives, update payroll_snapshots
$stmt = $sqlite->prepare("SELECT company_id, period, data FROM archives WHERE id LIKE 'payroll_%'");
$stmt->execute();
$archives = $stmt->fetchAll();
$count = 0;
foreach ($archives as $arch) {
    $data = json_decode($arch['data'], true);
    if (isset($data['salaries'])) {
        savePayrollSnapshot($sqlite, $arch['company_id'], $arch['period'], $data['salaries'], 'admin');
        $count++;
    }
}
echo "Fixed $count snapshots.";
?>
