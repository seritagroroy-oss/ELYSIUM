<?php
$targetDir = "C:\\laragon\\www\\pontage\\Ancien base de donnes SQLite a supprimer plus tard";
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$rootDir = "C:\\laragon\\www\\pontage";
$files = ["elysium.db", "pointage.db", "pontage.sqlite"];
$moved = [];
$errors = [];

foreach ($files as $basename) {
    $file = $rootDir . "\\" . $basename;
    $dest = $targetDir . "\\" . $basename;
    if (file_exists($file)) {
        if (@rename($file, $dest)) {
            $moved[] = $basename;
        } else {
            // Essaie copy + unlink
            if (@copy($file, $dest)) {
                if (@unlink($file)) {
                    $moved[] = $basename . " (copié et supprimé)";
                } else {
                    $moved[] = $basename . " (copié, erreur suppression)";
                }
            } else {
                $err = error_get_last();
                $errors[] = $basename . ": " . ($err['message'] ?? 'Erreur inconnue');
            }
        }
    }
}

echo json_encode(["status" => "success", "moved" => $moved, "errors" => $errors]);
