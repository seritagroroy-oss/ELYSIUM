<?php
require_once 'database.php';
$_GET['action'] = 'get_site_data';
$_GET['site_id'] = 'site_6774ec105ff76'; // Try to find a valid site
$_GET['period'] = '2029-02';
$_SESSION['company_id'] = 'comp_default_1';
$_SESSION['service_id'] = 'serv_default_1';

ob_start();
require 'api_new.php';
$json = ob_get_clean();

$data = json_decode($json, true);

if (!$data) {
    echo "Invalid JSON: " . substr($json, 0, 500);
    exit;
}

if (isset($data['site_data'])) {
    foreach ($data['site_data'] as $site) {
        foreach ($site['subsites'] as $subsite) {
            foreach ($subsite['agents'] as $agent) {
                if (!empty($agent['attendance'])) {
                    foreach ($agent['attendance'] as $att) {
                        if ($att['status'] === 'A') {
                            echo "Found agent: {$agent['name']} with attendance A on {$att['date']}\n";
                            print_r($att);
                            exit;
                        }
                    }
                }
            }
        }
    }
}
echo "No attendance A found in any site_data response.\n";
// Let's find WHICH site has an A.
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT a.subsite_id FROM agents a JOIN attendance att ON a.id = att.agent_id WHERE att.period = '2029-02' AND att.status = 'A' LIMIT 1");
$stmt->execute();
$subsite_id = $stmt->fetchColumn();
if ($subsite_id) {
    echo "\nFound subsite_id with A: $subsite_id\n";
    $stmt2 = $sqlite->prepare("SELECT site_id FROM subsites WHERE id = ?");
    $stmt2->execute([$subsite_id]);
    $site_id = $stmt2->fetchColumn();
    echo "This belongs to site_id: $site_id\n";
}

