<?php
$url = 'http://localhost/pontage/backend/api.php?action=get_pointage_for_archive&period=2026-07';
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$sites = $data['sites'] ?? [];
$extras = array_filter($sites, fn($s) => $s['id'] === 'site_extras_sur_site');
$extras = reset($extras);

echo "ARCHIVE AGENTS COUNT: \n";
$count = 0;
if ($extras && isset($extras['subsites'])) {
    foreach ($extras['subsites'] as $sub) {
        $count += count($sub['agents']);
    }
}
echo "TOTAL: " . $count . "\n";
print_r($extras);
