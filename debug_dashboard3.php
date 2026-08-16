<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($filePath);
echo "Line 3922: " . htmlspecialchars($lines[3921]) . "<br>";
echo "Line 6260: " . htmlspecialchars($lines[6259]) . "<br>";
?>
