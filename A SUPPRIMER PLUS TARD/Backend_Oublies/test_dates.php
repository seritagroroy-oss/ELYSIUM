<?php
require_once __DIR__ . '/core/functions.php';
$datesList = getPeriodDates('2026-05', 21, 20);
$dates_by_day = [];
for ($d = 1; $d <= 7; $d++) {
    $dates_by_day[$d] = [];
}
foreach ($datesList as $dateStr) {
    $dow = date('N', strtotime($dateStr)); // 1=Mon, 7=Sun
    $dates_by_day[$dow][] = $dateStr;
}
echo json_encode(['datesList' => $datesList, 'dates_by_day' => $dates_by_day]);
