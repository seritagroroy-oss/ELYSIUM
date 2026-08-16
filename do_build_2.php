<?php
chdir(__DIR__ . '/frontend');
echo shell_exec('npm run build 2>&1');
?>
