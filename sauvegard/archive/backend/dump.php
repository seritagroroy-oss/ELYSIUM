<?php
/**
 * debug2.php — Vérification directe de ce qui est dans MySQL
 */
require_once __DIR__ . '/database.php';

$sqlite = getDb();

// Vérifier quelle entreprise est connectée
// D'abord: afficher toutes les données functions (raw) pour détecter name===id et fullName
$stmt = $sqlite->prepare("SELECT service_id, data_key, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute([]);
$rows = $stmt->fetchAll();

$problems = [];
$clean = [];

foreach ($rows as $row) {
    $sid = $row['service_id'];
    $funcs = json_decode($row['data_value'], true);
    if (!is_array($funcs)) { $problems[] = ['sid' => $sid, 'error' => 'JSON invalide']; continue; }
    
    $hasFullName = false;
    $hasNameEqId = false;
    $details = [];
    foreach ($funcs as $f) {
        if (isset($f['fullName'])) $hasFullName = true;
        if (($f['name'] ?? '') === ($f['id'] ?? '')) $hasNameEqId = true;
        $details[] = ['id' => $f['id'], 'name' => $f['name'] ?? null, 'hasFullName' => isset($f['fullName'])];
    }
    
    if ($hasFullName || $hasNameEqId) {
        $problems[] = [
            'service_id'  => $sid,
            'hasFullName' => $hasFullName,
            'hasNameEqId' => $hasNameEqId,
            'functions'   => $details,
        ];
    } else {
        $clean[] = $sid;
    }
}

header('Content-Type: application/json');
echo json_encode([
    'total_rows' => count($rows),
    'problematic' => $problems,
    'clean_count' => count($clean),
    'clean_services' => $clean,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
