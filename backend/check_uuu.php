<?php
session_start();
$_GET['action'] = 'debug_get_sites';
$_SESSION['user_id'] = 'admin';
$_SESSION['company_id'] = 'comp_bb90668e';
$_SESSION['user_role'] = 'admin';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/core/functions.php';
$sqlite = getDb();
$salaries = generateSalariesData($sqlite, '2027-11', 'comp_bb90668e', 'company_id', 'comp_bb90668e', '');

$extras = array_filter($salaries, function($s) {
    return strpos($s['site'], 'EXTRA SUR SITE') !== false || strpos($s['site'], 'EXTRA') !== false;
});

echo json_encode(['extras_agents' => array_values($extras)]);
