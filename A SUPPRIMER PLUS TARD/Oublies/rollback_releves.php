<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';
$new_subsite_id = '1786991749_896_1'; // Where they are now
$old_subsite_id = 'site_releves_1';    // Where they should go back to
$old_service_id = 'svc_1779873050_955'; // Their original service ID

try {
    $db->beginTransaction();

    $stmt1 = $db->prepare("
        UPDATE agents 
        SET subsite_id = ?, service_id = ?
        WHERE subsite_id = ? AND company_id = ?
    ");
    $stmt1->execute([$old_subsite_id, $old_service_id, $new_subsite_id, $company_id]);
    $agents_moved = $stmt1->rowCount();

    $db->commit();

    echo "SUCCES:\n";
    echo "- Agents ramenés vers l'ancienne zone : $agents_moved\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERREUR: " . $e->getMessage();
}
?>
