<?php
$file = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content = file_get_contents($file);

$content = str_replace("'site_administration', ", "", $content);
$content = str_replace(", 'site_administration'", "", $content);

file_put_contents($file, $content);
echo "Cleaned array checks safely.\n";
?>
