<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, data FROM archives WHERE company_id = ? AND period = '2026-07'");
$stmt->execute([$company_id]);
$arch = $stmt->fetch(PDO::FETCH_ASSOC);

if ($arch && !empty($arch['data'])) {
    $decoded = base64_decode($arch['data'], true);
    if ($decoded) {
        $uncompressed = @gzuncompress($decoded);
        if ($uncompressed) {
            $data = json_decode($uncompressed, true);
            echo "Keys in data: " . implode(', ', array_keys($data)) . "\n";
            if (isset($data['sites'])) {
                echo "Number of sites: " . count($data['sites']) . "\n";
            }
            if (isset($data['subsites'])) {
                echo "Number of subsites: " . count($data['subsites']) . "\n";
                foreach ($data['subsites'] as $s) {
                    if (strpos($s['id'], 'itc') !== false) {
                        echo "Subsite matching itc: {$s['id']} - {$s['name']}\n";
                    }
                }
            }
        }
    }
}
