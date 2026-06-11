<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'db.php';
require_once 'backend/database.php';

try {
    $email = 'newuser' . time() . '@gmail.com';
    $password = 'test1234';
    $name = 'New User';
    $service_name = 'New Service';
    
    $dummyDb = [];
    $company_id = createCompany($dummyDb, $service_name, $email);
    $service_id = 'svc_' . time() . '_' . rand(100, 999);
       
    $sqlite = getDb();
    $stmtService = $sqlite->prepare('INSERT INTO services (id, name, company_id) VALUES (?, ?, ?)');
    $stmtService->execute([$service_id, $service_name, $company_id]);

    $assigned_role = 'admin';

    $cfg = getSubscriptionConfig();
    $trialStart = time();
    $trialEnd = strtotime('+' . ((int) ($cfg['trial_days'] ?? 15)) . ' days', $trialStart);
       
    $stmtUser = $sqlite->prepare('
           INSERT INTO users (
               email, password, name, role, role_display_name, service, service_id, 
               company_id, permissions, trial_started_at, trial_ends_at, 
               subscription_until, subscription_plan, subscription_price, subscription_currency
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
       
    $stmtUser->execute([
           $email,
           password_hash($password, PASSWORD_DEFAULT),
           $name,
           $assigned_role,
           'Propriétaire',
           $service_name,
           $service_id,
           $company_id,
           json_encode(getDefaultServicePermissions()),
           date('Y-m-d H:i:s', $trialStart),
           date('Y-m-d H:i:s', $trialEnd),
           null,
           (string) ($cfg['plan_code'] ?? 'premium_monthly'),
           (int) ($cfg['monthly_price'] ?? 20000),
           (string) ($cfg['currency'] ?? 'XOF')
    ]);
    
    echo "Success!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
