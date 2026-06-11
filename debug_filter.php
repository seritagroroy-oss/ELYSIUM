<?php
$site_id = 'site_administration';
$siteName = 'Administration'; // simplified
$agent = [
    'attendance' => [
        ['date' => '2026-06-01', 'shift_code' => 'J', 'status' => ''], // Home site
        ['date' => '2026-06-02', 'shift_code' => 'J', 'status' => 'EXT|🏢 Administration'],
        ['date' => '2026-06-03', 'shift_code' => 'N', 'status' => 'M|🏢 Administration - Bureau']
    ]
];

$processed_att = [];
foreach ($agent['attendance'] as $att) {
    // Only keep if the status indicates deployment/mutation to THIS site
    // This requires checking if the site name is in the status
    $is_here = false;
    if (strpos($att['status'], 'M|') === 0 || strpos($att['status'], 'EXT') === 0 || strpos($att['status'], 'REL') === 0) {
        // Very basic check: does the status contain the current site ID or name?
        // Actually, the status string contains the site NAME, not ID.
        // But we don't have the site name easily available in api.php here... wait, we can query it!
    }
}
