<?php
header('Content-Type: text/plain');
$content = file_get_contents(__DIR__ . '/../frontend/src/components/scratch.txt');
$utf8 = str_replace("\x00", "", $content);
echo substr($utf8, 0, 5000);
?>
