<?php
require 'core/functions.php';
$sqlite = getDb();

// Set dummy session
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = '';

$_POST['site_id'] = 'site_1'; // Wait, I need to know the actual site_id.
// Let's find the site_id from attendance
$stmt = $sqlite->query("SELECT a.status FROM attendance a WHERE a.status LIKE 'REL%' LIMIT 1");
$row = $stmt->fetch();
if (!$row) { echo "NO REL FOUND"; exit; }
$status = $row['status'];
$parts = explode('|', $status);
$site_name = $parts[1] ?? '';

$stmt2 = $sqlite->prepare("SELECT id FROM sites WHERE name = ?");
$stmt2->execute([$site_name]);
$site_row = $stmt2->fetch();
$site_id = $site_row['id'];

$_POST['site_id'] = $site_id;
$_POST['period'] = '2026-07'; // or whatever the current period is
// Actually let's use the period from the db
$stmt3 = $sqlite->query("SELECT period FROM attendance WHERE status LIKE 'REL%' LIMIT 1");
$prow = $stmt3->fetch();
$_POST['period'] = $prow['period'];

ob_start();
$action = 'get_site_data';
$data = ['site_id' => $site_id, 'period' => $prow['period']];
$company_id = 'comp_default_1';
$serviceKey = '';
$period = $prow['period'];
require 'modules/pointage.php';
$json = ob_get_clean();

file_put_contents('dump.json', $json);
echo "Dumped to dump.json for site_id $site_id and period $period";
