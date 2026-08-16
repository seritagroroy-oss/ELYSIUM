<?php
$lines = file('c:/laragon/www/pontage/php_errors_custom.log');
$lastLines = array_slice($lines, -50);
file_put_contents('c:/laragon/www/pontage/tail_log.txt', implode("", $lastLines));
echo "TAIL DONE";
