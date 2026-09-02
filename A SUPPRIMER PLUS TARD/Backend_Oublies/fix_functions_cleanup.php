<?php
/**
 * Nettoyer les doublons dans service_data.functions pour toutes les entreprises
 * et supprimer le champ fullName parasite stocké en base.
 */
require_once __DIR__ . '/database.php';
$sqlite = getDb();
$stmt = $sqlite->prepare("SELECT service_id, data_value FROM service_data WHERE data_key = 'functions'");
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$results = [];

foreach ($rows as $row) {
    $svcId = $row['service_id'];
    $funcs = json_decode($row['data_value'], true);
    if (!is_array($funcs)) continue;
    
    $cleanFuncs = [];
    $seenIds = [];
    $changed = false;
    
    foreach ($funcs as $fn) {
        $fnId = trim($fn['id'] ?? '');
        if ($fnId === '') { $changed = true; continue; }
        
        $fnIdNorm = strtoupper(preg_replace('/\s+/', ' ', $fnId));
        if (isset($seenIds[$fnIdNorm])) {
            // Duplicate - skip it
            $changed = true;
            continue;
        }
        $seenIds[$fnIdNorm] = true;
        
        // Strip fullName
        if (isset($fn['fullName'])) {
            unset($fn['fullName']);
            $changed = true;
        }
        
        $cleanFuncs[] = $fn;
    }
    
    if ($changed) {
        $stmtUpd = $sqlite->prepare("UPDATE service_data SET data_value = ? WHERE service_id = ? AND data_key = 'functions'");
        $stmtUpd->execute([json_encode($cleanFuncs, JSON_UNESCAPED_UNICODE), $svcId]);
        $results[$svcId] = ['before' => count($funcs), 'after' => count($cleanFuncs), 'cleaned' => true];
    } else {
        $results[$svcId] = ['count' => count($funcs), 'cleaned' => false];
    }
}

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
