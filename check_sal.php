<?php
$data = json_decode(file_get_contents('pointage_db.json'), true);
if (isset($data['service_data'])) {
    foreach ($data['service_data'] as $k => $v) {
        if (isset($v['salary_config'])) {
            echo "Service $k salary_config: " . json_encode($v['salary_config']) . "\n";
        } else {
            echo "Service $k has no salary_config\n";
        }
    }
} else {
    echo "No service_data found in DB\n";
}
?>
