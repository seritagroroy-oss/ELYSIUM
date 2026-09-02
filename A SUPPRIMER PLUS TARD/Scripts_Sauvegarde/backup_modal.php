<?php
$source = 'c:\\laragon\\www\\pontage\\frontend\\src\\components\\modals\\PaymentImportModal.jsx';
$destDir = 'c:\\laragon\\www\\pontage\\sauvegard';
if (!is_dir($destDir)) {
    mkdir($destDir, 0777, true);
}
$dest = $destDir . '\\PaymentImportModal.jsx';
if (copy($source, $dest)) {
    echo "Backup successful.\n";
} else {
    echo "Backup failed.\n";
}
