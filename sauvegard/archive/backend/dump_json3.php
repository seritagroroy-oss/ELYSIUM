<?php
require 'database.php';
$sqlite = getDb();

// Need to mock functions
function isPayrollPeriodLocked() { return false; }

$stmt = $sqlite->query("SELECT a.agent_id, a.status, a.period FROM attendance a WHERE a.status LIKE 'REL%' LIMIT 1");
$row = $stmt->fetch();
if (!$row) { echo "NO REL FOUND"; exit; }
$status = $row['status'];
$parts = explode('|', $status);
$site_name = $parts[1] ?? '';

$stmt2 = $sqlite->prepare("SELECT id FROM sites WHERE name = ?");
$stmt2->execute([$site_name]);
$site_row = $stmt2->fetch();
$site_id = $site_row['id'];

$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = '';
$_POST['site_id'] = $site_id;
$_POST['period'] = $row['period'];

ob_start();
$action = 'get_site_data';
$data = ['site_id' => $site_id, 'period' => $row['period']];
$company_id = 'comp_default_1';
$serviceKey = '';
$period = $row['period'];
require 'modules/pointage.php';
$json = ob_get_clean();

file_put_contents('dump.json', $json);
echo "Dumped to dump.json for site_id $site_id and period {$row['period']} for agent {$row['agent_id']} with status $status";
