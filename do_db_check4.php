<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();

// 1. Find the company ID for "SECURITEX SA"
$stmt = $sqlite->query("SELECT * FROM admin_users WHERE name LIKE '%KOFFI%'");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$companyId = 'comp_default_1';
if (count($users) > 0) {
    // try to find company
}

// 2. Fetch published_periods
$stmt = $sqlite->prepare("SELECT * FROM service_data WHERE service_id = ? AND data_key = 'published_periods'");
$stmt->execute([$companyId]);
$published = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 3. Fetch archives
$stmt = $sqlite->prepare("SELECT id, service_id, company_id, period FROM archives WHERE company_id = ?");
$stmt->execute([$companyId]);
$archives = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 4. Fetch latest publication
$stmt = $sqlite->prepare("SELECT * FROM service_data WHERE service_id = ? AND data_key = 'latest_publication'");
$stmt->execute([$companyId]);
$latest = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'users' => $users,
    'published' => $published,
    'archives' => $archives,
    'latest' => $latest
], JSON_PRETTY_PRINT);
?>
