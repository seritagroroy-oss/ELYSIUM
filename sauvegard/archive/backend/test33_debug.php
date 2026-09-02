<?php
$datesList = [];
for($i=21; $i<=31; $i++) $datesList[] = "2026-07-$i";
for($i=1; $i<=20; $i++) $datesList[] = "2026-08-" . str_pad($i, 2, '0', STR_PAD_LEFT);

$attMap = [
    '2026-07-21' => 'PM|LDF',
    '2026-07-22' => 'PM|LDF',
];
for($i=23; $i<=31; $i++) $attMap["2026-07-$i"] = '1';
for($i=1; $i<=20; $i++) $attMap["2026-08-" . str_pad($i, 2, '0', STR_PAD_LEFT)] = '1';

$totalA = 0;
$totalEntrant = 0;
$totalRupture = 0;

$isDestinationMutation = false;
if (isset($attMap[$datesList[0]]) && (strpos($attMap[$datesList[0]], 'M|') === 0 || strpos($attMap[$datesList[0]], 'PM|') === 0)) {
    $isDestinationMutation = true;
}

foreach ($datesList as $d) {
    $st = $attMap[$d] ?? '';
    $hasMutation = false;
    if (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0) {
        $hasMutation = true;
        $totalRupture++;
        $totalEntrant++;
    }
}

$shouldRunCorrection = !$isDestinationMutation;
if (count($datesList) > 30 && $totalRupture > 0 && $shouldRunCorrection) {
    $surplus = count($datesList) - 30;
    $adjust = min($totalRupture, $surplus);
    if ($totalEntrant >= $adjust) {
        $totalEntrant -= $adjust;
    } else {
        $rem = $adjust - $totalEntrant;
        $totalEntrant = 0;
        $totalA = max(0, $totalA - $rem);
    }
}

$totalP = max(0, 30 - $totalA - $totalEntrant);
echo "NEW SITE: totalP = $totalP\n";


// OLD SITE
$attMapOld = [
    '2026-07-21' => 'A', // After adding absence
    '2026-07-22' => '1',
];
for($i=23; $i<=31; $i++) $attMapOld["2026-07-$i"] = 'M|EXTRAS';
for($i=1; $i<=20; $i++) $attMapOld["2026-08-" . str_pad($i, 2, '0', STR_PAD_LEFT)] = 'M|EXTRAS';

$totalA = 0;
$totalEntrant = 0;
$totalRupture = 0;

$isDestinationMutation = false;
if (isset($attMapOld[$datesList[0]]) && (strpos($attMapOld[$datesList[0]], 'M|') === 0 || strpos($attMapOld[$datesList[0]], 'PM|') === 0)) {
    $isDestinationMutation = true;
}

foreach ($datesList as $d) {
    $st = $attMapOld[$d] ?? '';
    if ($st === 'A') $totalA++;
    if (strpos($st, 'M|') === 0 || strpos($st, 'PM|') === 0) {
        $totalRupture++;
        $totalEntrant++;
    }
}

$shouldRunCorrection = !$isDestinationMutation;
if (count($datesList) > 30 && $totalRupture > 0 && $shouldRunCorrection) {
    $surplus = count($datesList) - 30;
    $adjust = min($totalRupture, $surplus);
    if ($totalEntrant >= $adjust) {
        $totalEntrant -= $adjust;
    } else {
        $rem = $adjust - $totalEntrant;
        $totalEntrant = 0;
        $totalA = max(0, $totalA - $rem);
    }
}

$totalP = max(0, 30 - $totalA - $totalEntrant);
echo "OLD SITE (with absence): totalP = $totalP\n";
