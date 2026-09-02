<?php
$json = file_get_contents('http://127.0.0.1:8000/api_new.php?action=get_site_data&site_id=40&period=2043-02');
$data = json_decode($json, true);

foreach ($data['subsites'] as $subsite) {
    foreach ($subsite['agents'] as $agent) {
        if ($agent['name'] === 'OSLO') {
            echo "OSLO in subsite: " . $subsite['name'] . "\n";
            echo "is_clone: " . ($agent['is_clone'] ?? 'false') . "\n";
            echo "origin_absences: " . ($agent['origin_absences'] ?? 'undefined') . "\n";
            echo "days_consumed_by_origin: " . ($agent['days_consumed_by_origin'] ?? 'undefined') . "\n";
        }
    }
}
?>
