<?php
$output = shell_exec('git diff HEAD~3 HEAD backend/modules/pointage.php');
file_put_contents('c:\laragon\www\pontage\backend\test_git_diff.txt', $output);
echo "Done";
