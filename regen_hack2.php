<?php
session_start();
if (isset($_GET['regenerate_secret'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['company_id'] = 'COMP_1782782782';
    
    require "backend/database.php";
    require "backend/core/functions.php";
    
    $sqlite = getDb();
    // Trouver la compagnie
    $stmt = $sqlite->query("SELECT company_id, service_id, period FROM archives WHERE id LIKE 'payroll_%' AND period = '2026-08' LIMIT 1");
    $row = $stmt[0] ?? null;
    if (!$row) die("Archive non trouvee");
    
    $companyKey = $row['company_id'];
    $period = $row['period'];
    $_SERVER['HTTP_HOST'] = 'pontage.test';
    
    $salariesData = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, $serviceKey);
    
    $archive_id = 'payroll_' . $period;
    $stmtUp = $sqlite->prepare("UPDATE archives SET data = ? WHERE id = ? AND company_id = ?");
    $stmtUp->execute([json_encode($salariesData), $archive_id, $companyKey]);
    
    die("Archive REGEN SUCCESS for $companyKey $archive_id");
}
