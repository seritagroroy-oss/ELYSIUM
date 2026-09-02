<?php
$db_path = 'c:\laragon\www\pontage\backend\database\database.sqlite';
try {
    $sqlite = new PDO('sqlite:' . $db_path);
    $stmt = $sqlite->prepare("SELECT data FROM archives_pointage WHERE period = '2044-11'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $data = $row['data'];
        if (strpos($data, 'ANDRE') !== false) {
            echo "ANDRE is IN the archive JSON!\n";
        } else {
            echo "ANDRE is NOT in the archive JSON.\n";
        }
    } else {
        echo "No archive found for 2044-11.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
