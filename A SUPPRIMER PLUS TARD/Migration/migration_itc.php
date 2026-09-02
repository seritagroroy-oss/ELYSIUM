<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$company_id = 'comp_cf66d02f';
$new_site_id = '1786993680_651';
$new_service_id = 'svc_52f7a282';

$zones = [
    'itc_tenue_compcf66d02f'   => ['new_sub_id' => $new_site_id . '_tenue',   'name' => 'Tenue Régulière'],
    'itc_costume_compcf66d02f' => ['new_sub_id' => $new_site_id . '_costume', 'name' => 'Costume'],
    'itc_ots_compcf66d02f'     => ['new_sub_id' => $new_site_id . '_ots',     'name' => 'OTS'],
    'itc_as_compcf66d02f'      => ['new_sub_id' => $new_site_id . '_as',      'name' => 'Agent Spécial']
];

try {
    $db->beginTransaction();

    $stmtInsertZone = $db->prepare("
        INSERT INTO subsites (id, name, site_id, service_id, company_id) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmtUpdateAgents = $db->prepare("
        UPDATE agents 
        SET subsite_id = ?, service_id = ?
        WHERE subsite_id = ? AND company_id = ?
    ");

    $total_agents_moved = 0;

    foreach ($zones as $old_sub_id => $data) {
        $new_sub_id = $data['new_sub_id'];
        
        // 1. Create the zone in the DB
        $stmtInsertZone->execute([$new_sub_id, $data['name'], $new_site_id, $new_service_id, $company_id]);
        
        // 2. Move agents
        $stmtUpdateAgents->execute([$new_sub_id, $new_service_id, $old_sub_id, $company_id]);
        $moved = $stmtUpdateAgents->rowCount();
        
        echo "- Création de la zone '{$data['name']}' et transfert de $moved agents.\n";
        $total_agents_moved += $moved;
    }
    
    // Optionally remove the auto-generated empty 'Zone Principale' to keep things clean
    $db->query("DELETE FROM subsites WHERE id = '1786993680_651_1' AND (SELECT COUNT(*) FROM agents WHERE subsite_id = '1786993680_651_1') = 0");

    $db->commit();

    echo "SUCCES GLOBAL : $total_agents_moved agents transferés avec succes !\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "ERREUR: " . $e->getMessage();
}
?>
