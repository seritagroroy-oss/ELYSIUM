<?php
$files = [
    'c:\\laragon\\www\\pontage\\rapports\\frontend\\src\\components\\Salaries.jsx',
    'c:\\laragon\\www\\pontage\\rapports\\frontend\\src\\components\\PayrollView.jsx',
    'c:\\laragon\\www\\pontage\\rapports\\frontend\\src\\components\\Payslip.jsx',
    'c:\\laragon\\www\\pontage\\rapports\\frontend\\src\\components\\MasseSalariale.jsx',
    'c:\\laragon\\www\\pontage\\rapports\\frontend\\src\\components\\PayslipPrintView.jsx'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    
    $content = file_get_contents($file);
    
    // Replace state fallbacks
    $content = str_replace(
        "cnps_salarial: 6.3, cnps_patronal: 7.7, its: 1.2, fdfp: 1.2, taxe_formation: 0.6, taxe_apprentissage: 0.4, accidents_travail: 2.0, cmu_amount: 500,",
        "cnps_salarial: 0, cnps_patronal: 0, its: 0, fdfp: 0, taxe_formation: 0, taxe_apprentissage: 0, accidents_travail: 0, cmu_amount: 0,",
        $content
    );
    $content = str_replace(
        "taux_hs_jour: 15, taux_hs_nuit: 50, taux_hs_dimanche: 75, taux_hs_ferie: 100,",
        "taux_hs_jour: 0, taux_hs_nuit: 0, taux_hs_dimanche: 0, taux_hs_ferie: 0,",
        $content
    );

    // Replace || 6.3 with ?? 0
    // We'll use regex to fix all the (payrollSettings.value || fallback) issues
    $content = preg_replace('/(payrollSettings(?:\??\.|\??\[["\'])[\w_]+(?:["\']\])?)\s*\|\|\s*(?:6\.3|7\.7|1\.2|15|50|75|100|0\.6|0\.4|2\.0|500)/', '$1 ?? 0', $content);
    
    // some places might use parseFloat or Number
    $content = preg_replace('/parseFloat\((payrollSettings\??\.[\w_]+)\s*\|\|\s*[\d\.]+\)/', 'parseFloat($1 ?? 0)', $content);

    file_put_contents($file, $content);
}
echo "Done.";
