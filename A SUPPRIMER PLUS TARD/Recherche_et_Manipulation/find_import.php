<?php
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('c:\laragon\www\pontage\backend'));
foreach ($files as $file) {
    if ($file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        if (strpos($content, 'import_payment_methods') !== false) {
            echo "Found in: " . $file->getPathname() . "\n";
        }
    }
}
