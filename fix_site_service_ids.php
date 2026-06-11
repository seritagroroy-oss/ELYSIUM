<?php
require 'backend/database.php';
$db = getDb();

// Assignation par inférence temporelle (timestamp dans les IDs)
$assignments = [
    '1779799757_965' => 'svc_1779788544_353', // IFM -> ghdfhfdhhd (proche temporellement)
    '1779409899_406' => 'svc_1779390619_638', // ACMC -> rerrrg
    '1779409911_331' => 'svc_1779390619_638', // CHANTIER -> rerrrg
    '1779409922_206' => 'svc_1779390619_638', // ADMINISTRATION -> rerrrg
    '1779409955_554' => 'svc_1779390619_638', // LDF -> rerrrg
    '1779409976_922' => 'svc_1779390619_638', // PETRO IVOIRE -> rerrrg
    '1779409986_819' => 'svc_1779390619_638', // RESIDENCE -> rerrrg
    '1779537236_116' => 'svc_1779536911_889', // dddd -> uyfi (proche temporellement)
];

foreach ($assignments as $site_id => $service_id) {
    $stmt = $db->prepare("UPDATE sites SET service_id = ? WHERE id = ?");
    $stmt->execute([$service_id, $site_id]);
    echo "  ✓ Site $site_id -> service $service_id\n";
}

echo "\nTerminé. Vérification finale:\n";
$remaining = $db->query("SELECT COUNT(*) as c FROM sites WHERE service_id IS NULL OR service_id = ''");
echo "Sites encore sans service_id: " . ($remaining[0]['c'] ?? 0) . "\n";
