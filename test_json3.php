<?php
$json = file_get_contents('c:/laragon/www/pontage/pointage_db.json');
$data = json_decode($json, true);

$results = [];
if (isset($data['attendance'])) {
    foreach ($data['attendance'] as $site_id => $site_att) {
        foreach ($site_att as $agent_id => $agent_att) {
            $results[$site_id][$agent_id] = 1;
        }
    }
}
echo json_encode($results, JSON_PRETTY_PRINT);
