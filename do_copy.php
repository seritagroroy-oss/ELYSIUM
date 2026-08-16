<?php
if(copy('backend/modules/attendance.php', 'sauvegard/attendance.php')) {
    echo "Copied successfully.";
} else {
    echo "Failed to copy.";
}
unlink(__FILE__);
