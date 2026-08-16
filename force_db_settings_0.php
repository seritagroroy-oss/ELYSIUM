<?php
session_start();
require_once 'backend/config.php';
require_once 'backend/utils.php';

// Force payroll settings to 0 for all companies in the DB
$companies = $db->query("SELECT id FROM companies")->fetchAll(PDO::FETCH_ASSOC) ?? [];

foreach ($companies as $c) {
    $companyKey = $c['id'];
    $targetKey = 'company::' . $companyKey;
    
    // We get current to keep other settings (like boolean flags)
    $settings = getServiceDataSql($targetKey, 'payroll_settings', []);
    
    if (empty($settings)) {
        $settings = getServiceDataSql($companyKey, 'payroll_settings', []);
    }
    
    // Overwrite the percentages with 0
    $settings['cnps_salarial'] = 0;
    $settings['cnps_patronal'] = 0;
    $settings['its'] = 0;
    $settings['fdfp'] = 0;
    $settings['taux_hs_jour'] = 0;
    $settings['taux_hs_nuit'] = 0;
    $settings['taux_hs_dimanche'] = 0;
    $settings['taux_hs_ferie'] = 0;
    $settings['accidents_travail'] = 0;
    $settings['taxe_formation'] = 0;
    $settings['taxe_apprentissage'] = 0;
    $settings['cmu_amount'] = 0;
    
    setServiceDataSql($targetKey, 'payroll_settings', $settings);
    setServiceDataSql($companyKey, 'payroll_settings', $settings);
}
echo "DB Updated.";
