<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, data FROM archives WHERE company_id = ?");
$stmt->execute([$company_id]);
$archives = is_array($stmt) ? $stmt : (method_exists($stmt, 'fetchAll') ? $stmt->fetchAll(PDO::FETCH_ASSOC) : []);

foreach ($archives as $arch) {
    if (!empty($arch['data'])) {
        $decoded = base64_decode($arch['data'], true);
        if ($decoded) {
            $uncompressed = @gzuncompress($decoded);
            if ($uncompressed) {
                if (strpos($uncompressed, 'KEKELY') !== false || strpos($uncompressed, 'DJAHOUE') !== false || strpos($uncompressed, 'NIAMIEN') !== false) {
                    echo "Found KEKELY/DJAHOUE/NIAMIEN in archive period: {$arch['period']}\n";
                }
            }
        }
    }
}
