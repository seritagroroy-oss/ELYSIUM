<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, data FROM archives_pointage WHERE company_id = ?");
$stmt->execute([$company_id]);
$archives = is_array($stmt) ? $stmt : (method_exists($stmt, 'fetchAll') ? $stmt->fetchAll(PDO::FETCH_ASSOC) : []);

$found = false;
foreach ($archives as $arch) {
    if (!empty($arch['data'])) {
        $decoded = base64_decode($arch['data'], true);
        if ($decoded) {
            $uncompressed = @gzuncompress($decoded);
            if ($uncompressed) {
                if (strpos($uncompressed, 'KEKELY') !== false || strpos($uncompressed, 'DJAHOUE') !== false || strpos($uncompressed, 'NIAMIEN') !== false) {
                    echo "Found KEKELY/DJAHOUE/NIAMIEN in archives_pointage period: {$arch['period']}\n";
                    $found = true;
                    // Let's decode and find which subsite they were in!
                    $data = json_decode($uncompressed, true);
                    foreach ($data['sites'] as $site) {
                        foreach ($site['subsites'] as $sub) {
                            foreach ($sub['agents'] as $agent) {
                                if (strpos($agent['name'], 'KEKELY') !== false || strpos($agent['name'], 'DJAHOUE') !== false) {
                                    echo "Agent {$agent['name']} was in site {$site['id']}, subsite {$sub['id']}\n";
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
if (!$found) echo "Not found in archives_pointage either.\n";
