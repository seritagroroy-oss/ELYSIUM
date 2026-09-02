<?php
session_start();
// Dummy session data
$_SESSION['company_id'] = 'comp_default_1';
// we'll assume service_id is empty or set
$_POST['site_id'] = 'site_1'; // Wait, I don't know the user's site ID.
// Let's just run pointage.php directly or simulate its output for all sites
require 'core/functions.php';

$sqlite = getDb();
$period = date('Y-m'); // Usually this month
$company_id = 'comp_default_1';
$serviceKey = '';

// Find a site that has a REL% attendance
$stmt = $sqlite->query("SELECT a.status FROM attendance a WHERE a.status LIKE 'REL%' LIMIT 1");
$row = $stmt->fetch();
if (!$row) {
    echo "NO REL ATTENDANCES FOUND!";
    exit;
}
$status = $row['status']; // e.g. REL_T|Site C
$parts = explode('|', $status);
$site_name = $parts[1] ?? '';

// Find the site_id for this site name
$stmt2 = $sqlite->prepare("SELECT id FROM sites WHERE name = ?");
$stmt2->execute([$site_name]);
$site_row = $stmt2->fetch();
if (!$site_row) {
    echo "SITE NOT FOUND FOR NAME: $site_name\n";
    exit;
}
$site_id = $site_row['id'];

$_POST['site_id'] = $site_id;
$_POST['period'] = $period;

// Let's capture the output of pointage.php
ob_start();
require 'modules/pointage.php';
$json = ob_get_clean();

$data = json_decode($json, true);
if (!$data || !isset($data['subsites'])) {
    echo "FAILED TO PARSE JSON OR NO SUBSITES:\n$json";
    exit;
}

$found = false;
foreach($data['subsites'] as $sub) {
    foreach($sub['agents'] as $ag) {
        // check attendance
        if (isset($ag['attendance'])) {
            foreach($ag['attendance'] as $att) {
                if (strpos($att['status'], 'REL') === 0) {
                    echo "FOUND AGENT " . $ag['name'] . " IN SUBSITE " . $sub['name'] . " WITH STATUS " . $att['status'] . "\n";
                    $found = true;
                }
            }
        }
    }
}

if (!$found) {
    echo "AGENT NOT RETURNED IN JSON BY POINTAGE.PHP!\n";
}
