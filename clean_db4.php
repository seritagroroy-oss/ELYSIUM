<?php
require "backend/database.php";

$period = '2026-08';
$sqlite = getDb();
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    // 1. Clean published_periods
    $stmt = $sqlite->db->query("SELECT service_id, data_value FROM service_data WHERE data_key = 'published_periods'");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $r) {
        $comp = $r['service_id'];
        $val = json_decode($r['data_value'], true);
        if (is_array($val) && in_array($period, $val)) {
            $new_val = array_values(array_filter($val, fn($p) => $p !== $period));
            $update = $sqlite->db->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'published_periods'");
            $update->execute([json_encode($new_val), $comp]);
            echo "Cleaned published_periods for $comp.<br/>\n";
        }
    }

    // 2. Force delete snapshot for ALL companies (Since it's mysql, wait, NO! payroll_snapshots is in SQLite!)
    // Yes, payroll_snapshots was added to SQLite in initSqlite() in database.php!
    $stmt = $sqlite->db->prepare("DELETE FROM payroll_snapshots WHERE period = ?");
    $stmt->execute([$period]);
    echo "Deleted from payroll_snapshots. Rows: " . $stmt->rowCount() . "<br/>\n";

    // 3. Force delete archives for ALL companies
    $stmt = $sqlite->db->prepare("DELETE FROM archives WHERE period = ? OR id = ?");
    $stmt->execute([$period, 'payroll_' . $period]);
    echo "Deleted from archives. Rows: " . $stmt->rowCount() . "<br/>\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
