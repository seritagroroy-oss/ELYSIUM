<?php
$json = file_get_contents('c:/laragon/www/pontage/pointage_db.json');
$data = json_decode($json, true);
$keys = array_keys($data['attendance']);
echo "Sites: " . count($keys) . "\n";
if (count($keys) > 0) {
    $firstSite = $keys[0];
    echo "First site: $firstSite\n";
    $agents = array_keys($data['attendance'][$firstSite]);
    echo "Agents in first site: " . count($agents) . "\n";
    echo "First few agents: \n";
    print_r(array_slice($agents, 0, 5));
}
