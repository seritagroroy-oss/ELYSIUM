<?php
require_once 'db.php';
require_once 'backend/database.php';
$_SESSION['service_id'] = 'svc_1779873050_955'; // The test service ID from pc55@gmail.com
$_SESSION['user_role'] = 'admin';

$sqlite = getDb();
$service_id = $_SESSION['service_id'];

// Get all sites
$sites = $sqlite->query("SELECT * FROM sites WHERE service_id = '$service_id'");
foreach ($sites as &$site) {
    $site['subsites'] = $sqlite->query("SELECT * FROM subsites WHERE site_id = '{$site['id']}'");
    foreach ($site['subsites'] as &$subsite) {
        $subsite['agents'] = $sqlite->query("SELECT * FROM agents WHERE subsite_id = '{$subsite['id']}'");
    }
}
print_r($sites);
