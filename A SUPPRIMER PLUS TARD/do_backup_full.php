<?php
$backupDir = 'c:\\laragon\\www\\pontage\\sauvegard';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

// 1. Backup files
$files = [
    'c:\\laragon\\www\\pontage\\backend\\modules\\sites.php',
    'c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $dest = $backupDir . DIRECTORY_SEPARATOR . basename($file) . '_' . date('Ymd_His') . '.bak';
        copy($file, $dest);
        echo "Copied " . basename($file) . " to " . $dest . "\n";
    }
}

// 2. Backup database
$dbBackupFile = $backupDir . DIRECTORY_SEPARATOR . 'elysium_backup_' . date('Ymd_His') . '.sql';
$cmd = "c:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe -u root elysium > " . $dbBackupFile;
exec($cmd, $output, $return_var);
if ($return_var === 0) {
    echo "Database dumped successfully to " . $dbBackupFile . "\n";
} else {
    // Fallback if mysqldump path is different or not found
    $cmd2 = "mysqldump -u root elysium > " . $dbBackupFile;
    exec($cmd2, $out2, $ret2);
    if ($ret2 === 0) {
        echo "Database dumped successfully (using global mysqldump) to " . $dbBackupFile . "\n";
    } else {
        echo "Failed to dump database.\n";
    }
}

// 3. Delete this script as per rule "Nettoyage Systématique des Scripts Temporaires"
// We'll leave it to be deleted right after running via router.
?>
