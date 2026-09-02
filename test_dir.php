<?php
function listFiles($dir) {
    if (is_dir($dir)) {
        if ($dh = opendir($dir)) {
            while (($file = readdir($dh)) !== false) {
                if ($file != '.' && $file != '..') {
                    echo "filename: $file\n";
                }
            }
            closedir($dh);
        }
    } else {
        echo "Dir not found: $dir\n";
    }
}
listFiles("c:/laragon/www/pontage/backend/data");
echo "------\n";
listFiles("c:/laragon/www/pontage/backend/data/services");
