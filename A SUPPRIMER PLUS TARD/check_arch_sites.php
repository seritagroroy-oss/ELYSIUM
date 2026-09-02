<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, data FROM archives WHERE company_id = ? ORDER BY period DESC LIMIT 1");
$stmt->execute([$company_id]);
$arch = $stmt->fetch(PDO::FETCH_ASSOC);

if ($arch && !empty($arch['data'])) {
    $decoded = base64_decode($arch['data'], true);
    if ($decoded) {
        $uncompressed = @gzuncompress($decoded);
        if ($uncompressed) {
            $data = json_decode($uncompressed, true);
            if (isset($data['sites'])) {
                foreach ($data['sites'] as $site) {
                    echo "Site: {$site['id']} - {$site['name']}\n";
                }
            }
        }
    }
}
