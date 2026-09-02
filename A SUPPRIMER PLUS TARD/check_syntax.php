<?php
$files = [
    'c:\laragon\www\pontage\backend\modules\sites_v2.php',
    'c:\laragon\www\pontage\backend\modules\pointage.php'
];

foreach ($files as $file) {
    echo "Checking $file...\n";
    $output = shell_exec("php -l " . escapeshellarg($file) . " 2>&1");
    echo $output . "\n";
}
?>
