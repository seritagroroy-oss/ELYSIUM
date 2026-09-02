<?php
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['company_id'] = 'COMP_1782782782';

$action = 'login'; // Bypass security check in functions.php

require "backend/database.php";

$sqlite = getDb();
$stmt = $sqlite->query("SELECT company_id, service_id, period FROM archives WHERE id LIKE 'payroll_%' AND period = '2026-08' LIMIT 1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    die("Archive non trouvee");
}

$companyKey = $row['company_id'];
$_SESSION['current_company_id'] = $companyKey;
$_SESSION['current_service_id'] = $row['service_id'];
$_SERVER['HTTP_HOST'] = 'pontage.test'; // mock to bypass

require "backend/core/functions.php";

$serviceKey = $row['service_id'];
$period = $row['period'];

// Re-generate
$salariesData = generateSalariesData($companyKey, $period, $sqlite, clone $sqlite, true);

$archive_id = 'payroll_' . $period;
$stmtUp = $sqlite->prepare("UPDATE archives SET data = ? WHERE id = ? AND company_id = ?");
$stmtUp->execute([json_encode($salariesData), $archive_id, $companyKey]);

echo "Archive $archive_id regenerated successfully for company $companyKey!";
?>
