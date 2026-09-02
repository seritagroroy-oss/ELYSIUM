<?php
$files = [
    'c:\laragon\www\pontage\backend\modules\sites_v2.php',
    'c:\laragon\www\pontage\backend\modules\pointage.php'
];

foreach ($files as $file) {
    $content = file_get_contents($file);

    if (basename($file) === 'sites_v2.php') {
        // Remove injection
        $content = str_replace(
            "            if (!\$has_itc)\n                \$sites_rows[] = ['id' => 'site_itc', 'name' => 'ITC / IFM', 'is_billed' => 1];\n", 
            "", 
            $content
        );

        // Update in_array list
        $content = str_replace(
            "in_array(\$site['id'], ['site_releves', 'site_administration', 'site_itc'])",
            "in_array(\$site['id'], ['site_releves', 'site_administration'])",
            $content
        );

        // Remove dynamic zones for ITC
        $itc_zones_block = "                if (\$site['id'] === 'site_itc') {\n                    \$comp_suffix = substr(preg_replace('/[^a-z0-9]/', '', strtolower(\$companyKey ?? '')), 0, 12);\n                    \$subs = [\n                        ['id' => 'itc_tenue_' . \$comp_suffix, 'name' => 'Tenue Régulière'],\n                        ['id' => 'itc_costume_' . \$comp_suffix, 'name' => 'Costume'],\n                        ['id' => 'itc_ots_' . \$comp_suffix, 'name' => 'OTS'],\n                        ['id' => 'itc_special_' . \$comp_suffix, 'name' => 'Agent Spécial']\n                    ];\n                }\n";
        $content = str_replace($itc_zones_block, "", $content);
        
    } elseif (basename($file) === 'pointage.php') {
        // Remove injection
        $content = str_replace(
            "        if (!\$has_itc) {\n            \$sites[] = ['id' => 'site_itc', 'name' => 'ITC / IFM'];\n            // Auto-persister site_itc dans la base si absent avec la signature du PC\n            try { \$sqlite->exec(\"INSERT IGNORE INTO sites (id, name, is_billed, source_module, service_id) VALUES ('site_itc', 'ITC / IFM', 1, 'PC', '\$serviceKey')\"); } catch(Exception \$e) {}\n        }\n",
            "",
            $content
        );
        $content = str_replace(
            "            if (!\$has_itc) \$sites[] = ['id' => 'site_itc', 'name' => 'ITC / IFM', 'source_module' => 'PC'];\n",
            "",
            $content
        );
        
        // Remove in_array from hardcoded list
        $content = str_replace(
            "in_array(\$site_ref['id'], ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc'])",
            "in_array(\$site_ref['id'], ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration'])",
            $content
        );
        
        $content = str_replace(
            "in_array(\$site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc'])",
            "in_array(\$site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration'])",
            $content
        );
    }

    file_put_contents($file, $content);
    echo "Cleaned $file\n";
}
?>
