<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'comp_cf66d02f';
$_SESSION['role'] = 'admin';
$_SESSION['service_id'] = 'serv_default_1';

require 'backend/database.php';
require 'backend/core/functions.php';

$sqlite = getDb();
$companyKey = 'comp_cf66d02f';
$period = '2026-08';
$target_col = 'company_id';
$target_val = $companyKey;
$serviceKey = null; // Comme dans l'API réelle (scope=company)

// Simuler exactement l'API get_salaries
$salaries = generateSalariesData($sqlite, $period, $companyKey, $target_col, $target_val, $serviceKey);

foreach ($salaries as $s) {
    if (strpos(strtolower($s['name'] ?? ''), 'SOUKOU') !== false) {
        echo "<pre>";
        echo "=== " . $s['name'] . " dans generateSalariesData ===\n";
        print_r($s);
        echo "\n\nABSENCES:\n";
        print_r($s['absence_details']);
        echo "name: " . $s['name'] . "\n";
        echo "base: " . ($s['base'] ?? 'N/A') . "\n";
        echo "total: " . ($s['total'] ?? 'N/A') . "\n";
        echo "active_days: " . ($s['active_days'] ?? 'N/A') . "\n";
        echo "jours_travailles: " . ($s['jours_travailles'] ?? 'N/A') . "\n";
        echo "deductions: " . ($s['deductions'] ?? 'N/A') . "\n";
        echo "gains: " . ($s['gains'] ?? 'N/A') . "\n";
        echo "is_special_salary: " . ($s['is_special_salary'] ?? false ? 'YES' : 'NO') . "\n";
        echo "is_special: " . ($s['is_special'] ?? false ? 'YES' : 'NO') . "\n";
        // Tous les clés
        echo "\nToutes les clés retournées:\n";
        foreach ($s as $k => $v) {
            if (!is_array($v)) echo "  $k => $v\n";
        }
        echo "</pre>\n";
    }
}
?>
