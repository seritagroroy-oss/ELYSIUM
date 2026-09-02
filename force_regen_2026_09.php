<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTPS'] = 'off';
$_SERVER['HTTP_X_FORWARDED_PROTO'] = 'http';
session_start();
$_SESSION['user_id'] = '1';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['user_role'] = 'admin';

require_once __DIR__ . '/backend/database.php';
require_once __DIR__ . '/backend/core/functions.php';

try {
    $sqlite = getDb();
    $companyKey = 'comp_default_1';
    $serviceKey = null;
    $period = '2026-09';
    
    // On recalcule la paie AVEC LES NOUVELLES REGLES
    $salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
    
    // On met a jour UNIQUEMENT LA PHOTO FIGEE (snapshot)
    savePayrollSnapshot($sqlite, $companyKey, $period, $salaries, $serviceKey);
    
    echo 'Regen done for 2026-09';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
