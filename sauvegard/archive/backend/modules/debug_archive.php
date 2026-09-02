<?php
$log = "C:/laragon/tmp/archive_debug.log";
file_put_contents($log, date('Y-m-d H:i:s') . " - Called archive_pointage\n", FILE_APPEND);
file_put_contents($log, "POST payload length: " . strlen(file_get_contents('php://input')) . "\n", FILE_APPEND);
file_put_contents($log, "memory_limit: " . ini_get('memory_limit') . "\n", FILE_APPEND);
file_put_contents($log, "post_max_size: " . ini_get('post_max_size') . "\n", FILE_APPEND);
