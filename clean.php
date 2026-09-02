<?php
foreach (glob("c:/laragon/www/pontage/test_*.php") as $filename) {
    unlink($filename);
}
foreach (glob("c:/laragon/www/pontage/fix_*.php") as $filename) {
    unlink($filename);
}
echo "Cleaned.";
