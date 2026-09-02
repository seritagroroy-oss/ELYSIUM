<?php
require 'backend/database.php';
require 'backend/core/functions.php';
$db = getDb();
// run functions.php payload for sasasa
$period = '2026-08';
$company_id = 'comp_default_1';
$serviceKey = 'serv_pontage_ci'; // adjust if needed

$stmtAg = $db->query("SELECT id FROM agents WHERE name LIKE '%SASASA%' LIMIT 1");
$sasasa_id = $stmtAg->fetchColumn();

// We need to simulate the payroll calculation for SASASA
// It's hard to call generateSalariesData without the huge dependencies
// Let's just select the supplementaires_externes for SASASA
$stmtSupp = $db->prepare("SELECT * FROM supplementaires_externes WHERE agent_id = ?");
$stmtSupp->execute([$sasasa_id]);
print_r($stmtSupp->fetchAll(PDO::FETCH_ASSOC));
