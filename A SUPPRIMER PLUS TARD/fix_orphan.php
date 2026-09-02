<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($filePath);

$startIdx = 4560 - 1;
$endIdx = 4619 - 1;

array_splice($lines, $startIdx, $endIdx - $startIdx + 1, []);
file_put_contents($filePath, implode("", $lines));
echo "Successfully removed orphaned AddSiteModal code!";
?>
