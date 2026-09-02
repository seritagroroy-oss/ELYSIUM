<?php
$file1 = 'c:\laragon\www\pontage\backend\modules\sites_v2.php';
$content1 = file_get_contents($file1);

$target_sites = "            if (!array_filter(\$sites_rows, fn(\$s) => \$s['id'] === 'site_extras_sur_site'))\n                \$sites_rows[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE', 'is_billed' => 1];\n";
$content1 = str_replace($target_sites, "", $content1);
file_put_contents($file1, $content1);
echo "Cleaned sites_v2.php\n";

$file2 = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content2 = file_get_contents($file2);

$target_ptg1 = "        if (!\$has_extras_sur_site) {\n            \$sites[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE'];\n        }\n";
$content2 = str_replace($target_ptg1, "", $content2);

$target_ptg2 = "            if (!\$has_extras_sur) \$sites[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE', 'source_module' => 'PC'];\n";
$content2 = str_replace($target_ptg2, "", $content2);

// arrays
$content2 = str_replace("'site_extras_sur_site', ", "", $content2);

file_put_contents($file2, $content2);
echo "Cleaned pointage.php\n";
?>
