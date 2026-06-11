<?php
require 'backend/database.php';
$db = getDb();
$res = $db->query("SELECT id, name, service_id, company_id FROM sites WHERE service_id IS NULL OR service_id = ''");
foreach ($res as $r) {
    print_r($r);
    // Find a service for this company
    $stmt = $db->prepare("SELECT id FROM services WHERE company_id = ? LIMIT 1");
    $stmt->execute([$r['company_id']]);
    $svc = $stmt->fetch();
    if ($svc) {
        $stmtUpdate = $db->prepare("UPDATE sites SET service_id = ? WHERE id = ?");
        $stmtUpdate->execute([$svc['id'], $r['id']]);
        
        $stmtSub = $db->prepare("UPDATE subsites SET service_id = ? WHERE site_id = ?");
        $stmtSub->execute([$svc['id'], $r['id']]);
        
        echo "Updated site {$r['name']} to service {$svc['id']}\n";
    }
}
