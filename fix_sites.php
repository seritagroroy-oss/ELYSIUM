<?php
require_once 'backend/database.php';
$json = file_get_contents('pointage_db.json');
$data = json_decode($json, true);
$db = getDb();

foreach ($data['service_data'] ?? [] as $svcId => $svcData) {
    foreach ($svcData['sites'] ?? [] as $site) {
        $stmt = $db->prepare('UPDATE sites SET service_id = ? WHERE id = ?');
        $stmt->execute([$svcId, $site['id']]);
    }
}
echo "Sites updated!";
