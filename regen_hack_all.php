<?php
session_start();
if (isset($_GET['regenerate_secret'])) {
    $_SESSION['user_id'] = 1;
    
    require "backend/database.php";
    require "backend/core/functions.php";
    
    $sqlite = getDb();
    $stmt = $sqlite->query("SELECT company_id, service_id, period FROM archives WHERE id LIKE 'payroll_%' AND period = '2026-08'");
    
    $_SERVER['HTTP_HOST'] = 'pontage.test';
    
    $success = [];
    
    foreach ($stmt as $row) {
        $companyKey = $row['company_id'];
        $period = $row['period'];
        $serviceKey = $row['service_id'];
        
        $_SESSION['company_id'] = $companyKey;
        $_SESSION['current_company_id'] = $companyKey;
        $_SESSION['current_service_id'] = $serviceKey;
        
        $salariesData = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
        
        $archive = [
            'salaries' => $salariesData,
            'company' => $companyKey,
            'period' => $period,
            'archived_at' => date('Y-m-d H:i:s'),
            'archived_by' => 'Cloture Manuelle (Regen)',
            'stats' => [] // Optional stats
        ];
        
        $archive_id = 'payroll_' . $period;
        $stmtUp = $sqlite->prepare("UPDATE archives SET data = ? WHERE id = ? AND company_id = ?");
        $stmtUp->execute([json_encode($archive), $archive_id, $companyKey]);
        
        $success[] = $companyKey;
    }
    
    die("Archive REGEN SUCCESS FIXED for: " . implode(', ', $success));
}
