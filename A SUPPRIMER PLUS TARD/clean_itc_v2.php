<?php
$file1 = 'c:\laragon\www\pontage\backend\modules\sites_v2.php';
$content1 = file_get_contents($file1);

// Remove the hardcoded injection for site_itc near line 72
$content1 = preg_replace('/if \(!\$has_itc\)\s*\$sites_rows\[\] = \[\'id\' => \'site_itc\', \'name\' => \'ITC \/ IFM\', \'is_billed\' => 1\];/s', '', $content1);

// Remove the site_itc logic for generating subsites dynamically near line 84
$content1 = preg_replace('/if \(\$site\[\'id\'\] === \'site_itc\'\) \{[^}]+?\}[\r\n\s]*\];\s*\}/s', '', $content1); // Less strict

// Wait, let's just use simple manual removal of site_itc from the arrays.
$content1 = str_replace("'site_administration', 'site_itc'", "'site_administration'", $content1);
$content1 = str_replace(", 'site_itc'", "", $content1);
$content1 = str_replace("if (\$site['id'] === 'site_itc')", "if (false)", $content1); // neutralize it

file_put_contents($file1, $content1);

$file2 = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content2 = file_get_contents($file2);

$content2 = str_replace(", 'site_itc'", "", $content2);
$content2 = preg_replace('/if \(!\$has_itc\).*?;/s', '', $content2);
$content2 = str_replace("if (\$site['id'] === 'site_itc')", "if (false)", $content2); // neutralize it

file_put_contents($file2, $content2);
echo "Done.\n";
?>
