<?php
$cwd = 'c:\\laragon\\www\\pontage\\frontend';
$cmd = 'npm run build 2>&1';
exec("cd $cwd && $cmd", $output, $return_var);
echo "Return var: $return_var\n";
echo implode("\n", $output);
?>
