<?php
$source_pointage = __DIR__ . '/backend/modules/pointage.php';
$dest_pointage = 'D:/Pontage - VRAI 07 07 2026/backend/modules/pointage.php';

$source_sites = __DIR__ . '/backend/modules/sites.php';
$dest_sites = 'D:/Pontage - VRAI 07 07 2026/backend/modules/sites.php';

$source_payroll = __DIR__ . '/frontend/src/components/PayrollView.jsx';
$dest_payroll = 'D:/Pontage - VRAI 07 07 2026/frontend/src/components/PayrollView.jsx';

if (file_exists($dest_pointage)) {
    copy($source_pointage, $dest_pointage);
    echo "Copied pointage.php!<br>";
} else {
    echo "Dest pointage not found: $dest_pointage<br>";
}

if (file_exists($dest_sites)) {
    copy($source_sites, $dest_sites);
    echo "Copied sites.php!<br>";
} else {
    echo "Dest sites not found: $dest_sites<br>";
}

if (file_exists($dest_payroll)) {
    copy($source_payroll, $dest_payroll);
    echo "Copied PayrollView.jsx!<br>";
} else {
    echo "Dest payroll not found: $dest_payroll<br>";
}
