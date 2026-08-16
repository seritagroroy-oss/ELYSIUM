<?php
$files = [
    'frontend/src/components/Salaries.jsx' => 'sauvegard/Salaries_fix_payment.jsx',
    'frontend/src/components/PayrollView.jsx' => 'sauvegard/PayrollView_fix_payment.jsx',
    'backend/modules/sites.php' => 'sauvegard/sites_fix_payment.php',
];
if (!is_dir('sauvegard')) mkdir('sauvegard');
foreach ($files as $src => $dst) {
    if (file_exists($src)) {
        copy($src, $dst);
        echo "Copied $src to $dst\n";
    } else {
        echo "File $src not found!\n";
    }
}
