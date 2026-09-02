<?php
chdir(__DIR__ . '/frontend');
exec('npm run build 2>&1', $output, $return_var);
echo "Return code: " . $return_var . "\n";
echo implode("\n", $output);
?>
