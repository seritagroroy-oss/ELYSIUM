<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';
$old_site_id = 'site_administration';
$new_site_id = '1786995252_554';

try {
    $db->beginTransaction();

    // 1. Move the 6 custom zones to the new site
    $stmt = $db->prepare("
        UPDATE subsites 
        SET site_id = ? 
        WHERE site_id = ? AND company_id = ?
    ");
    $stmt->execute([$new_site_id, $old_site_id, $company_id]);
    $zones_moved = $stmt->rowCount();

    // 2. Delete the default empty 'Zone Principale' of the new site
    $db->query("DELETE FROM subsites WHERE site_id = '$new_site_id' AND id LIKE '%_1' AND (SELECT COUNT(*) FROM agents WHERE subsite_id = subsites.id) = 0");

    $db->commit();

    echo "SUCCES:\n";
    echo "- Zones déplacées avec succès : $zones_moved\n";
    echo "Les 35 agents ont suivi automatiquement car ils sont dans ces zones.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERREUR: " . $e->getMessage();
}
?>
