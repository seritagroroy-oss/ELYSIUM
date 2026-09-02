<?php
$file2 = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content2 = file_get_contents($file2);

$target1 = "            if (!\$has_itc) \$sites[] = ['id' => 'site_itc', 'name' => 'ITC / IFM', 'source_module' => 'PC'];\n";
$content2 = str_replace($target1, "", $content2);

$target2 = "        if (!\$has_itc) {\n            \$sites[] = ['id' => 'site_itc', 'name' => 'ITC / IFM'];\n            // Auto-persister site_itc dans la base si absent avec la signature du PC\n            try { \$sqlite->exec(\"INSERT IGNORE INTO sites (id, name, is_billed, source_module, service_id) VALUES ('site_itc', 'ITC / IFM', 1, 'PC', '\$serviceKey')\"); } catch(Exception \$e) {}\n        }\n";
$content2 = str_replace($target2, "", $content2);

file_put_contents($file2, $content2);
echo "Cleaned safely.\n";
?>
