<?php
function searchFile($path, $query) {
    if (is_file($path)) {
        if (pathinfo($path, PATHINFO_EXTENSION) === 'jsx') {
            $content = file_get_contents($path);
            if (strpos($content, $query) !== false) {
                echo "FOUND IN: " . $path . "\n";
                $lines = explode("\n", $content);
                foreach ($lines as $i => $line) {
                    if (strpos($line, $query) !== false) {
                        echo "Line " . ($i+1) . ": " . trim($line) . "\n";
                    }
                }
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
searchFile('c:\\laragon\\www\\pontage\\frontend\\src', '<Dashboard');
