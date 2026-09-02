<?php
$zipFile = __DIR__ . '/elysium_deploy.zip';
$zip = new ZipArchive();
if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    die("Cannot open zip file");
}

$filesToInclude = [
    '.htaccess', 'api_new.php', 'api_new_admin.php', 'router.php',
    'db.php', 'pointage_db.json', 'elysium.db', 'utils.php', 'lang.php', 'elysium_logo.png'
];

foreach ($filesToInclude as $f) {
    if (file_exists(__DIR__ . '/' . $f)) {
        $zip->addFile(__DIR__ . '/' . $f, $f);
    }
}

$dirsToInclude = ['dist', 'backend'];
foreach ($dirsToInclude as $d) {
    $dirPath = __DIR__ . '/' . $d;
    if (!is_dir($dirPath)) continue;
    
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dirPath),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $name => $file) {
        if (!$file->isDir()) {
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen(__DIR__) + 1);
            $zip->addFile($filePath, $relativePath);
        }
    }
}

$zip->close();
echo "Archive créée avec succès dans $zipFile\n";
