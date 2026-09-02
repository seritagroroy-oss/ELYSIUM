<?php
$file = 'c:\\laragon\\www\\pontage\\backend\\patch_juillet.php';
if (file_exists($file)) {
    echo "patch_juillet.php Last Modified: " . date("Y-m-d H:i:s", filemtime($file)) . "\n";
} else {
    echo "patch_juillet.php not found.\n";
}
