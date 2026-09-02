<?php
$output = shell_exec('git log -p -1 c:\laragon\www\pontage\backend\modules\pointage.php');
file_put_contents('c:\laragon\www\pontage\backend\test_git_log.txt', $output);
echo "Done";
