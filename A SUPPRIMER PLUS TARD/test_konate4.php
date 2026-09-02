<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
try {
    $sqlite = new PDO('sqlite:' . __DIR__ . '/backend/data/database.sqlite');
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $sqlite->prepare("SELECT data FROM archives WHERE period = '2026-08'");
    $stmt->execute();
    $output = "";
    while ($row = $stmt->fetch()) {
        $data = json_decode($row['data'], true);
        $salaries = $data['salaries'] ?? $data;
        foreach ($salaries as $sal) {
            if (strpos($sal['name'], 'KONATE MOUSTAPHA') !== false) {
                $output .= "ID: {$sal['id']}\n";
                $output .= "Absences: {$sal['absences']}\n";
                $output .= "Details: " . json_encode($sal['absence_details']) . "\n";
                $output .= "Sp details: " . json_encode($sal['sp_details']) . "\n\n";
            }
        }
    }
    echo nl2br($output ?: 'No KONATE found in archives.');
} catch (Exception $e) {
    echo $e->getMessage();
}
