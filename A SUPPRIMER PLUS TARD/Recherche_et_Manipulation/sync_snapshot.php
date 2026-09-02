<?php
require __DIR__ . '/backend/database.php';
$sqlite = getDb();
$company_id = 'comp_cf66d02f'; // Since it's the main company
$period = '2026-07';

$stmt = $sqlite->prepare("SELECT snapshot FROM payroll_snapshots WHERE company_id = ? AND period = ?");
$stmt->execute([$company_id, $period]);
$row = $stmt->fetch();

if ($row && $row['snapshot']) {
    $snapshotData = json_decode($row['snapshot'], true);
    
    // Fetch all current agents profiles
    $stmtAgents = $sqlite->prepare("SELECT id, profile_data FROM agents WHERE company_id = ?");
    $stmtAgents->execute([$company_id]);
    $agentsMap = [];
    while($ag = $stmtAgents->fetch()) {
        $agentsMap[$ag['id']] = $ag['profile_data'];
    }

    $updatedCount = 0;
    foreach ($snapshotData as &$agentData) {
        $ag_id = $agentData['id'] ?? '';
        if ($ag_id && isset($agentsMap[$ag_id])) {
            $agentData['profile_data'] = json_decode($agentsMap[$ag_id], true) ?: [];
            $updatedCount++;
        }
    }
    
    $updateStmt = $sqlite->prepare("UPDATE payroll_snapshots SET snapshot = ? WHERE company_id = ? AND period = ?");
    $updateStmt->execute([json_encode($snapshotData, JSON_UNESCAPED_UNICODE), $company_id, $period]);
    echo "Succes! $updatedCount profils mis à jour dans le snapshot.";
} else {
    echo "Aucun snapshot trouvé pour cette période.";
}
