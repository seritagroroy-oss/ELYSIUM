<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/backend/database.php';

// Création du dossier sauvegarde
$sauvegardDir = __DIR__ . '/sauvegard';
if (!is_dir($sauvegardDir)) {
    mkdir($sauvegardDir, 0777, true);
}

$sqlite = getDb();
$company_id = 'comp_default_1';
$period = $_GET['period'] ?? '2026-07';

if ($period === 'ALL') {
    $stmt = $sqlite->prepare("SELECT period FROM archives_pointage WHERE company_id = ?");
    $stmt->execute([$company_id]);
    $archives = $stmt->fetchAll(PDO::FETCH_ASSOC);
    die(json_encode(["archives" => $archives]));
}

try {
    // 1. Fetch current archive
    $stmt = $sqlite->prepare("SELECT id, data FROM archives_pointage WHERE company_id = ? AND period = ?");
    $stmt->execute([$company_id, $period]);
    $archive = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$archive) {
        die(json_encode(["error" => "Archive introuvable pour $period"]));
    }

    // 2. Backup Systematique
    $backupPath = $sauvegardDir . '/archive_' . str_replace('-', '_', $period) . '_backup.json';
    file_put_contents($backupPath, $archive['data']);

    // 3. Decode JSON
    $data = json_decode($archive['data'], true);
    if (!isset($data['sites'])) $data['sites'] = [];

    // 4. Fetch mutated agents for EXTRA SUR SITE
    $clean_site_name = 'EXTRA SUR SITE';
    $like_m = 'M|' . $clean_site_name;
    $like_ext = 'EXT%|' . $clean_site_name;
    $like_rel = 'REL%|' . $clean_site_name;

    $stmt_mut = $sqlite->prepare("
        SELECT DISTINCT a.agent_id, ag.*
        FROM attendance a
        JOIN agents ag ON a.agent_id = ag.id
        WHERE a.period = ?
        AND a.status IS NOT NULL AND a.status != '' AND a.status != '1' AND a.status != 'Repos'
        AND (a.status LIKE ? OR a.status LIKE ? OR a.status LIKE ? OR a.status LIKE 'Suppl|%')
    ");
    $stmt_mut->execute([$period, $like_m, $like_ext, $like_rel]);
    $raw_mutated = $stmt_mut->fetchAll(PDO::FETCH_ASSOC) ?: [];

    // Fetch attendance for these agents
    $agent_ids = array_unique(array_column($raw_mutated, 'agent_id'));
    $mutated_agents = [];

    if (!empty($agent_ids)) {
        $inMut = implode(',', array_map(function($id) { return "'" . str_replace("'", "''", $id) . "'"; }, $agent_ids));
        $stmtAtt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id IN ($inMut) AND period = ?");
        $stmtAtt->execute([$period]);
        $attRows = $stmtAtt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        
        $attMap = [];
        foreach ($attRows as $row) {
            $attMap[$row['agent_id']][] = $row;
        }
        
        foreach ($raw_mutated as $ag) {
            $ag_atts = $attMap[$ag['agent_id']] ?? [];
            $is_relevant = false;
            foreach ($ag_atts as $att) {
                if (strpos($att['status'], 'M|' . $clean_site_name) === 0 || strpos($att['status'], 'M|%' . $clean_site_name) === 0 || (strpos($att['status'], 'M|') === 0 && strpos($att['status'], $clean_site_name) !== false) || strpos($att['status'], 'PM|' . $clean_site_name) === 0 || (strpos($att['status'], 'PM|') === 0 && strpos($att['status'], $clean_site_name) !== false)) {
                    $is_relevant = true;
                    break;
                }
            }
            if ($is_relevant) {
                // Formatting for frontend
                $ag['attendance'] = $ag_atts;
                $ag['is_mutated'] = true;
                $ag['shift_history'] = json_decode($ag['shift_history'] ?? '[]', true) ?: [];
                $ag['profile_data'] = json_decode($ag['profile_data'] ?? '{}', true) ?: [];
                $mutated_agents[] = $ag;
            }
        }
    }

    // 5. Check if EXTRA SUR SITE exists in archive
    $foundIndex = -1;
    foreach ($data['sites'] as $idx => $site) {
        if ($site['id'] === 'site_extras_sur_site') {
            $foundIndex = $idx;
            break;
        }
    }

    $siteObject = [
        'id' => 'site_extras_sur_site',
        'name' => '🌟 EXTRA SUR SITE',
        'source_module' => 'PC',
        'subsites' => [
            [
                'id' => 'default_site_extras_sur_site',
                'name' => 'Zone Principale',
                'agents' => $mutated_agents
            ]
        ]
    ];

    if ($foundIndex >= 0) {
        $data['sites'][$foundIndex] = $siteObject;
        $msg = "Site existant mis à jour";
    } else {
        $data['sites'][] = $siteObject;
        $msg = "Nouveau site injecté";
    }

    // 6. Save back to DB
    $newJson = json_encode($data);
    $stmtUpd = $sqlite->prepare("UPDATE archives_pointage SET data = ? WHERE id = ?");
    $stmtUpd->execute([$newJson, $archive['id']]);

    echo json_encode([
        "success" => true, 
        "message" => "Archive $period réparée avec succès ($msg).", 
        "agents_ajoutes" => count($mutated_agents),
        "backup" => $backupPath
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
