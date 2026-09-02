<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';
$old_subsite_id = 'site_releves_1';
$new_subsite_id = '1786991749_896_1';
$new_service_id = 'svc_52f7a282';

try {
    $db->beginTransaction();

    $stmt1 = $db->prepare("
        UPDATE agents 
        SET subsite_id = ?, service_id = ?
        WHERE subsite_id = ? AND company_id = ?
    ");
    $stmt1->execute([$new_subsite_id, $new_service_id, $old_subsite_id, $company_id]);
    $agents_moved = $stmt1->rowCount();

    $db->commit();

    echo "SUCCES:\n";
    echo "- Agents deplacés avec succes vers la nouvelle zone : $agents_moved\n";
    echo "Tous les historiques de pointages sont intacts.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERREUR: " . $e->getMessage();
}
?>
