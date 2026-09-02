<?php
chdir(__DIR__ . '/frontend');
echo shell_exec('npx vite build --emptyOutDir false 2>&1');
?>
