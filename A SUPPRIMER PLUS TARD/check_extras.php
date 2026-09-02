<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';

// 1. Find the new site
$stmt = $db->query("SELECT id, name FROM sites WHERE name LIKE '%EXTRAS SUR SITES ABIDJAN%'");
$new_sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "--- NOUVEAU SITE --- \n";
print_r($new_sites);

// 2. Check agents in the old virtual site_extras_sur_site
$stmt = $db->query("
    SELECT subsite_id, COUNT(id) as count 
    FROM agents 
    WHERE company_id = '$company_id' AND (subsite_id = 'site_extras_sur_site_1' OR subsite_id LIKE 'site_extras_sur_site%')
    GROUP BY subsite_id
");
$old_agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- AGENTS DANS L'ANCIEN SITE VIRTUEL (Compagnie) --- \n";
print_r($old_agents);

// 3. Also check if they created custom subsites in the old site (like they did for administration)
$stmt = $db->query("
    SELECT id, name 
    FROM subsites 
    WHERE site_id = 'site_extras_sur_site' AND company_id = '$company_id'
");
$old_subsites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- SOUS-ZONES PERSONNALISÉES DANS L'ANCIEN SITE --- \n";
print_r($old_subsites);
?>
