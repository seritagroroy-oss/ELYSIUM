<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$agents = $sqlite->query("SELECT id, name, subsite_id, company_id FROM agents WHERE subsite_id LIKE 'site_itc_%'");
$count = 0;
foreach($agents as $a) {
    if (!empty($a['company_id'])) {
        $comp_suffix = substr(preg_replace('/[^a-z0-9]/', '', strtolower($a['company_id'])), 0, 12);
        
        $new_sub = '';
        if ($a['subsite_id'] === 'site_itc_tenue') $new_sub = 'itc_tenue_' . $comp_suffix;
        elseif ($a['subsite_id'] === 'site_itc_costume') $new_sub = 'itc_costume_' . $comp_suffix;
        elseif ($a['subsite_id'] === 'site_itc_ots') $new_sub = 'itc_ots_' . $comp_suffix;
        elseif ($a['subsite_id'] === 'site_itc_as') $new_sub = 'itc_special_' . $comp_suffix;
        
        if ($new_sub) {
            $stmt = $sqlite->prepare("UPDATE agents SET subsite_id = ? WHERE id = ?");
            $stmt->execute([$new_sub, $a['id']]);
            $count++;
            echo "Updated {$a['name']} to $new_sub (Company: {$a['company_id']})\n";
        }
    }
}
echo "Total updated: $count\n";
