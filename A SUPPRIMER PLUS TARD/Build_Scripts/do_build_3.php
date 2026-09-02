<?php
chdir(__DIR__);
$dir = 'dist';
if (is_dir($dir)) {
    shell_exec('rd /s /q ' . escapeshellarg($dir));
}
chdir(__DIR__ . '/frontend');
echo shell_exec('npm run build 2>&1');
?>
