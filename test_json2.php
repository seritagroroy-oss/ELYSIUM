<?php
$json = file_get_contents('c:/laragon/www/pontage/pointage_db.json');
$data = json_decode($json, true);

$results = [];
if (isset($data['attendance'])) {
    foreach ($data['attendance'] as $site_id => $site_att) {
        foreach ($site_att as $agent_id => $agent_att) {
            if ($agent_id === 'ag_1786404430_ag_1786393167_ag_1783965360_3806' || $agent_id === 'KONATE MOUSTAPHA') {
                $results[$site_id] = $agent_att;
            }
        }
    }
}
echo json_encode($results, JSON_PRETTY_PRINT);
