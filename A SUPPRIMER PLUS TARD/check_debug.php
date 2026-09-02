<?php
$log = "C:/laragon/tmp/archive_debug.txt";
if (file_exists($log)) {
    echo file_get_contents($log);
} else {
    echo "No debug log.";
}
