<?php
$_GET['action'] = 'get_site_data';
$_GET['site_id'] = 'site_administration';
$_GET['period'] = '2029-02';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'serv_default_1';
ob_start();
require 'api_new.php';
$json = ob_get_clean();
$data = json_decode($json, true);
if (isset($data['site_data'])) {
    foreach ($data['site_data'] as $site) {
        foreach ($site['subsites'] as $subsite) {
            foreach ($subsite['agents'] as $agent) {
                if ($agent['id'] === '6a4a985741ef5') {
                    echo "FOUND AGENT via API!\n";
                    print_r($agent['attendance']);
                    exit;
                }
            }
        }
    }
}
echo "AGENT NOT FOUND IN API RESPONSE!";
