<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';
$old_site_id = 'site_extras_sur_site';
$new_site_id = '1786996696_994';

try {
    $db->beginTransaction();

    // 1. Move the 23 custom zones to the new site
    $stmt = $db->prepare("
        UPDATE subsites 
        SET site_id = ? 
        WHERE site_id = ? AND company_id = ?
    ");
    $stmt->execute([$new_site_id, $old_site_id, $company_id]);
    $zones_moved = $stmt->rowCount();

    // 2. Delete the default empty 'Zone Principale' of the new site
    $db->query("DELETE FROM subsites WHERE site_id = '$new_site_id' AND id LIKE '%_1' AND (SELECT COUNT(*) FROM agents WHERE subsite_id = subsites.id) = 0");

    // 3. Delete site_extras_sur_site from sites table if it exists
    $db->query("DELETE FROM sites WHERE id = '$old_site_id'");

    $db->commit();

    echo "SUCCES:\n";
    echo "- Zones personnalisées déplacées avec succès : $zones_moved\n";
    echo "- Ancien site virtuel supprimé de la base de données.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERREUR: " . $e->getMessage();
}
?>
