<?php
$source = '../frontend/src/components/tables/DashboardTable.jsx';
$dest = '../sauvegard/DashboardTable.jsx';
if (!is_dir('../sauvegard')) {
    mkdir('../sauvegard', 0777, true);
}
if (copy($source, $dest)) {
    echo "Backup successful";
} else {
    echo "Backup failed";
}
unlink(__FILE__);
?>
