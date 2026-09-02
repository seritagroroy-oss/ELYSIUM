<?php
function searchFile($path, $query) {
    if (is_file($path)) {
        if (pathinfo($path, PATHINFO_EXTENSION) === 'php' || pathinfo($path, PATHINFO_EXTENSION) === 'js' || pathinfo($path, PATHINFO_EXTENSION) === 'jsx') {
            $content = file_get_contents($path);
            if (stripos($content, $query) !== false) {
                echo "FOUND IN: " . $path . "\n";
            }
        }
    } elseif (is_dir($path)) {
        $files = scandir($path);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                searchFile($path . DIRECTORY_SEPARATOR . $file, $query);
            }
        }
    }
}
searchFile('c:\\laragon\\www\\pontage', 'get_archives_pointage_data');
