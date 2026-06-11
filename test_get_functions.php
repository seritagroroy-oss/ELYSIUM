<?php
// Test direct de l'API get_functions avec une session simulée
require_once __DIR__ . '/backend/database.php';

// Simuler la session de comptabilite-securitex@gmail.com
session_start();
$_SESSION['company_id'] = 'comp_20837e85';
$_SESSION['service_id'] = 'svc_fd3eeaa3';
$_SESSION['user_role'] = 'user';

echo "=== Simulating get_functions for company comp_20837e85 ===\n";

// Logique identique à api.php case 'get_functions' (line 3959)
$company_id = $_SESSION['company_id'] ?? 'comp_default_1';
$company_key = 'company::' . $company_id;
$functions = getServiceDataSql($company_key, 'functions', []);
if (empty($functions)) {
    $functions = getServiceDataSql($company_id, 'functions', []);
}
$response = ['success' => true, 'functions' => $functions];

echo "Response: " . json_encode($response) . "\n";
echo "Has success: " . ($response['success'] ? 'true' : 'false') . "\n";
echo "Functions count: " . count($response['functions']) . "\n";
foreach ($response['functions'] as $f) {
    echo "  - " . $f['id'] . ": " . $f['name'] . "\n";
}
