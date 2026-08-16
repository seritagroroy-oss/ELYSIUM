<?php
$source = 'c:/laragon/www/pontage/backend/modules/facturation.php';
$dest_dir = 'c:/laragon/www/pontage/sauvegard';
if (!is_dir($dest_dir)) {
    mkdir($dest_dir, 0777, true);
}
$dest = $dest_dir . '/facturation.php.' . time() . '.bak';
if (copy($source, $dest)) {
    echo "Backup successful: $dest";
} else {
    echo "Backup failed!";
}
