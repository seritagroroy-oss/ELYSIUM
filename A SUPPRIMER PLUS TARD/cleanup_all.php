<?php
@unlink(__DIR__ . '/test_update.php');
@unlink(__DIR__ . '/fix_db.php');
@unlink(__DIR__ . '/fix_db2.php');
@unlink(__DIR__ . '/check_cols.php');
@unlink(__DIR__ . '/check_cols2.php');
echo "Cleaned up.";
?>
