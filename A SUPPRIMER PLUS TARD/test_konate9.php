<?php
require __DIR__ . '/backend/database.php';
require __DIR__ . '/backend/core/functions.php';

$sqlite = getDb();
$companyKey = '1782478544_525';
$period = '2026-08';

$salaries = generateSalariesData($sqlite, $period, $companyKey, 'company_id', $companyKey, null);

$output = "";
foreach ($salaries as $sal) {
    if (strpos(strtolower($sal['name']), 'konate moustapha') !== false) {
        $output .= "ID: {$sal['id']}\n";
        $output .= "Site: {$sal['site']}\n";
        $output .= "Absences: {$sal['absences']}\n";
        $output .= "Details:\n";
        foreach ($sal['absence_details'] as $det) {
            $output .= "  {$det['date']} - {$det['shift']} - {$det['reason']}\n";
        }
        $output .= "SP Details:\n";
        foreach ($sal['sp_details'] as $det) {
            $output .= "  {$det['date']} - {$det['shift']} - {$det['reason']}\n";
        }
        $output .= "----------------\n";
    }
}
file_put_contents(__DIR__ . '/test_konate9_out.txt', $output);
echo "DONE";
