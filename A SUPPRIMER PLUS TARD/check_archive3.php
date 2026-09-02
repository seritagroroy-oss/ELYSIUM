<?php
require_once __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f';

$stmt = $sqlite->prepare("SELECT period, data FROM archives WHERE company_id = ? ORDER BY period DESC LIMIT 3");
$stmt->execute([$company_id]);
$archives = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($archives as $arch) {
    echo "Period: " . $arch['period'] . "\n";
    if (!empty($arch['data'])) {
        $decoded = base64_decode($arch['data'], true);
        if ($decoded) {
            $uncompressed = @gzuncompress($decoded);
            if ($uncompressed) {
                $data = json_decode($uncompressed, true);
                if (isset($data['sites'])) {
                    foreach ($data['sites'] as $site) {
                        if ($site['id'] === 'site_itc') {
                            echo "  Found site_itc in archive!\n";
                            if (isset($site['subsites'])) {
                                foreach ($site['subsites'] as $sub) {
                                    $agentCount = isset($sub['agents']) ? count($sub['agents']) : 0;
                                    echo "    Subsite: {$sub['id']}, Agents: $agentCount\n";
                                    if (isset($sub['agents']) && count($sub['agents']) > 0) {
                                        echo "      Agent 1 ID: " . $sub['agents'][0]['id'] . ", Subsite ID: " . $sub['agents'][0]['subsite_id'] . "\n";
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
