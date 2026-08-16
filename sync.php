<?php
header('Content-Type: application/json; charset=UTF-8');

$backupFile = __DIR__ . '/sauvegard/elysium_mysql_backup_20260730_144038.sql';
if (!file_exists($backupFile)) {
    die(json_encode(["error" => "Backup file not found"]));
}

$handle = fopen($backupFile, "r");
$found = [];
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        if (strpos($line, 'INSERT INTO `archives_pointage`') !== false || strpos($line, 'archives_pointage') !== false) {
            if (strpos($line, '2026-07') !== false && strpos($line, 'comp_cf66d02f') !== false) {
                $found[] = substr($line, 0, 1000) . '... [TRUNCATED]';
            }
        }
    }
    fclose($handle);
}
echo json_encode(["matches" => $found]);
