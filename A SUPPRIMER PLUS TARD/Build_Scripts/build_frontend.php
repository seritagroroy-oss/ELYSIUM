<?php
header('Content-Type: text/plain');
chdir(__DIR__);
echo shell_exec('rmdir /s /q dist 2>&1');
echo "\nDeleted dist folder\n";

chdir(__DIR__ . '/frontend');
echo shell_exec('npm run build 2>&1');
echo "\nBuild finished.";
