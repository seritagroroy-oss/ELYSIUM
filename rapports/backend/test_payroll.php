<?php
require_once __DIR__ . '/database.php';
$db = getDb();
$stmt = $db->prepare("SELECT snapshot_data FROM payroll_snapshots ORDER BY created_at DESC LIMIT 1");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row && !empty($row['snapshot_data'])) {
    $data = json_decode($row['snapshot_data'], true);
    // Print structure or subset
    if (isset($data['siteData'])) {
        $firstSite = $data['siteData'][0] ?? null;
        if ($firstSite && isset($firstSite['agents'])) {
            $firstAgent = $firstSite['agents'][0] ?? null;
            echo json_encode(['firstAgent' => $firstAgent], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}
echo "No data found";
