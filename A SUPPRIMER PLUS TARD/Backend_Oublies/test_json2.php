<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'core/functions.php';
$_SESSION['user_id'] = 'admin@example.com';
$_SESSION['company_id'] = 'comp_fb486391';
$_SESSION['service_id'] = 'srv_b867c211';
$_GET['site_id'] = 'site_itc';
$_GET['period'] = '06/2026';
$_GET['scope'] = 'service';
$_GET['mode'] = 'individual';

ob_start();
include 'modules/sites.php';
$output = ob_get_clean();
$data = json_decode($output, true);

if (isset($data['data']['subsites'])) {
    foreach ($data['data']['subsites'] as $sub) {
        if (strpos($sub['name'], 'Costume') !== false || strpos($sub['name'], 'Tenue') !== false) {
            echo "Subsite: " . $sub['name'] . " (ID: " . $sub['id'] . ")\n";
            if (isset($sub['agents'])) {
                foreach ($sub['agents'] as $ag) {
                    echo "  - " . $ag['name'] . " (ID: " . $ag['id'] . ")\n";
                }
            }
        }
    }
}
