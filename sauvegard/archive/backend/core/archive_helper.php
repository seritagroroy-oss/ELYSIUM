<?php
/**
 * archive_helper.php
 * 
 * Contient les fonctions d'archivage du pointage.
 * internal_build_pointage_archive_direct = requêtes SQL directes (PAS de HTTP interne)
 * internal_build_archive_data = conservé pour compatibilité (ne plus utiliser depuis publish_period)
 */

/**
 * Construit les données d'archive du pointage directement via SQL.
 * NE FAIT AUCUNE REQUÊTE HTTP INTERNE — ne cause donc jamais de deadlock.
 *
 * @param PDO $sqlite La connexion à la base de données SQLite
 * @param string $company_id L'identifiant de l'entreprise
 * @param string $period La période (ex: 2026-08)
 * @return array Les données d'archive
 */
function internal_build_pointage_archive_direct($sqlite, $company_id, $period) {
    // 1. Congrès: récupérer les congés
    $leaves = [];
    try {
        $sqlite->exec("CREATE TABLE IF NOT EXISTS pointage_leaves (id TEXT PRIMARY KEY, agent_id TEXT, start_date TEXT, end_date TEXT, type TEXT, status TEXT, company_id TEXT, service_id TEXT)");
        $stmtL = $sqlite->prepare("SELECT * FROM pointage_leaves WHERE company_id = ?");
        $stmtL->execute([$company_id]);
        $leaves = $stmtL->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Exception $eLeaves) {}

    // 2. Récupérer les sites
    $sites = [];
    try {
        $stmtSites = $sqlite->prepare("SELECT * FROM sites WHERE company_id = ? AND source_module = 'PC'");
        $stmtSites->execute([$company_id]);
        $sites = $stmtSites->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Exception $eSites) {}

    // Injecter les sites virtuels
    $ids = array_column($sites, 'id');
    if (!in_array('site_extras', $ids)) $sites[] = ['id' => 'site_extras', 'name' => 'EXTRA BUREAU', 'source_module' => 'PC'];
    if (!in_array('site_extras_sur_site', $ids)) $sites[] = ['id' => 'site_extras_sur_site', 'name' => 'EXTRA SUR SITE', 'source_module' => 'PC'];
    if (!in_array('site_releves', $ids)) $sites[] = ['id' => 'site_releves', 'name' => 'Vivier des releves', 'source_module' => 'PC'];
    if (!in_array('site_administration', $ids)) $sites[] = ['id' => 'site_administration', 'name' => 'Administration', 'source_module' => 'PC'];
    if (!in_array('site_itc', $ids)) $sites[] = ['id' => 'site_itc', 'name' => 'ITC / IFM', 'source_module' => 'PC'];

    // 3. Pour chaque site, charger les agents + pointages
    foreach ($sites as &$site) {
        $siteId = $site['id'];

        // Subsites
        $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (company_id = ? OR company_id IS NULL OR company_id = '')");
        $stmtSub->execute([$siteId, $company_id]);
        $subsiteRows = $stmtSub->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if (empty($subsiteRows)) {
            $subsiteRows = [['id' => 'default_' . $siteId, 'name' => 'Zone Principale']];
        }

        $subsitesMap = [];
        foreach ($subsiteRows as $sub) {
            $sub['agents'] = [];
            $subsitesMap[$sub['id']] = $sub;
        }
        $subIds = array_keys($subsitesMap);

        // Agents
        if (!empty($subIds)) {
            $inClause = implode(',', array_map(function($id) { return "'" . str_replace("'", "''", $id) . "'"; }, $subIds));
            $stmtAg = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id IN ($inClause) AND company_id = ? AND (archived_period IS NULL OR archived_period = '' OR archived_period >= ?) ORDER BY created_at ASC");
            $stmtAg->execute([$company_id, $period]);
            $agentRows = $stmtAg->fetchAll(PDO::FETCH_ASSOC) ?: [];

            // Pointages
            $attendanceMap = [];
            if (!empty($agentRows)) {
                $agentIds = array_map(function($a) { return "'" . str_replace("'", "''", $a['id']) . "'"; }, $agentRows);
                $inAgents = implode(',', $agentIds);
                $stmtAtt = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id IN ($inAgents) AND period = ?");
                $stmtAtt->execute([$period]);
                foreach ($stmtAtt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $att) {
                    $attendanceMap[$att['agent_id']][] = $att;
                }
            }

            // Assigner les agents aux subsites
            $targetSub = $subIds[0] ?? null;
            foreach ($agentRows as &$agent) {
                $agent['attendance'] = $attendanceMap[$agent['id']] ?? [];
                if (isset($agent['shift_history']) && is_string($agent['shift_history'])) {
                    $agent['shift_history'] = json_decode($agent['shift_history'], true) ?: [];
                }
                $agent['profile_data'] = json_decode($agent['profile_data'] ?? '{}', true);

                $sub_id = $agent['subsite_id'] ?? $targetSub;
                if ($sub_id && isset($subsitesMap[$sub_id])) {
                    $subsitesMap[$sub_id]['agents'][] = $agent;
                } elseif ($targetSub && isset($subsitesMap[$targetSub])) {
                    $subsitesMap[$targetSub]['agents'][] = $agent;
                }
            }
            unset($agent);
        }

        $site['subsites'] = array_values($subsitesMap);
    }
    unset($site);

    // 4. Agents globaux
    $globalAgents = [];
    try {
        $stmtGA = $sqlite->prepare("SELECT id, name, function, site FROM agents WHERE company_id = ?");
        $stmtGA->execute([$company_id]);
        $globalAgents = $stmtGA->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Exception $eGA) {}

    return [
        "sites"        => $sites,
        "leaves"       => $leaves,
        "globalAgents" => $globalAgents
    ];
}

/**
 * @deprecated Utiliser internal_build_pointage_archive_direct à la place.
 * Conservé uniquement pour compatibilité avec l'action archive_pointage de l'API.
 */
function internal_build_archive_data($sqlite, $company_id, $period) {
    return internal_build_pointage_archive_direct($sqlite, $company_id, $period);
}
