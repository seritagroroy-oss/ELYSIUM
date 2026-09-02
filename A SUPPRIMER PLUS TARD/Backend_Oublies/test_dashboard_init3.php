<?php
require_once 'database.php';
$_GET['action'] = 'get_dashboard_init';
$_GET['period'] = '2026-07';
$_GET['site_id'] = 'site_extras_sur_site';
$_SESSION['company_id'] = 'comp_cf66d02f';

// Capture output
ob_start();

// Inject debug code into pointage.php temporarily
$content = file_get_contents('c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php');
$content = str_replace(
    'foreach ($mutated_agents as $ma) {',
    'echo "DEBUG_MUTATED_COUNT:" . count($mutated_agents) . "\n"; foreach ($mutated_agents as $ma) {',
    $content
);
file_put_contents('c:\\laragon\\www\\pontage\\backend\\modules\\pointage_temp.php', $content);

require 'modules/pointage_temp.php';
$output = ob_get_clean();

echo "OUTPUT START:\n";
echo substr($output, 0, 500); // Print first 500 chars to see the debug
echo "\nOUTPUT END\n";

unlink('c:\\laragon\\www\\pontage\\backend\\modules\\pointage_temp.php');
