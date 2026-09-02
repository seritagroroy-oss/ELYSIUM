<?php
$file2 = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content2 = file_get_contents($file2);

$content2 = str_replace(", 'site_itc'", "", $content2);
$content2 = str_replace("'site_administration', 'site_itc'", "'site_administration'", $content2);

file_put_contents($file2, $content2);
echo "Cleaned array checks safely.\n";
?>
