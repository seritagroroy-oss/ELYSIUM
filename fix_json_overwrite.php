<?php
$file_sites = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content_sites = file_get_contents($file_sites);

// In delete_subsite
$search_subsite = <<<EOT
            if (\$res) {
                \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
EOT;
$replace_subsite = <<<EOT
            if (\$res) {
                if (!\$snapshot_data) \$snapshot_data = json_encode(\$res, JSON_UNESCAPED_UNICODE);
EOT;
$content_sites = str_replace(str_replace("\r\n", "\n", $search_subsite), $replace_subsite, $content_sites);

// In delete_agent
$content_sites = str_replace(str_replace("\r\n", "\n", $search_subsite), $replace_subsite, $content_sites); // It's exactly the same code block!

file_put_contents($file_sites, $content_sites);


$file_att = 'c:/laragon/www/pontage/backend/modules/attendance.php';
$content_att = file_get_contents($file_att);

$content_att = str_replace(str_replace("\r\n", "\n", $search_subsite), $replace_subsite, $content_att);

file_put_contents($file_att, $content_att);

echo "Backend JSON overwrite fixed\n";
