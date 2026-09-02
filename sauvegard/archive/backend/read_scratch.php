<?php
header('Content-Type: text/plain');
$content = file_get_contents(__DIR__ . '/../frontend/src/components/scratch.txt');
$utf8 = mb_convert_encoding($content, 'UTF-8', 'UTF-16LE');
echo substr($utf8, 0, 5000);
?>
