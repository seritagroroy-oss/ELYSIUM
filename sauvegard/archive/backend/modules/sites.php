<?php
/**
 * Module Sites & Espaces de travail — sites.php
 * RECONSTRUIT depuis backup
 */

switch ($action) {
    case 'get_sites':
        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        $companyKey = $_SESSION['company_id'] ?? null;
        $scope = $_GET['scope'] ?? 'service';
        $module = $_GET['module'] ?? null;
        
        // Charger sites par company_id par défaut pour partager entre tous les services
        $target_col = ($scope === 'service') ? 'service_id' : 'company_id';
        $target_val = ($scope === 'service') ? $serviceKey : $companyKey;

        try { $sqlite->exec("ALTER TABLE sites ADD COLUMN is_billed INTEGER DEFAULT 1"); } catch (Exception $e) {}
        
        $is_billed = isset($_GET['is_billed']) ? $_GET['is_billed'] : null;
        
        $query = "SELECT * FROM sites WHERE $target_col = ?";
        $params = [$target_val];
        
        if ($module) {
            $query .= " AND source_module = ?";
            $params[] = $module;
        }
        
        if ($is_billed !== null) {
            $query .= " AND COALESCE(is_billed, 1) = ?";
            $params[] = (int)$is_billed;
        }
        
        $stmt = $sqlite->prepare($query);
        $stmt->execute($params);
        $sites_rows = $stmt->fetchAll();

        // Inject virtual sites
        $has_extras = false;
        $has_releves = false;
        $has_admin = false;
        $has_itc = false;
        foreach ($sites_rows as $s) {
            if ($s['id'] === 'site_extras')
                $has_extras = true;
            if ($s['id'] === 'site_releves')
                $has_releves = true;
            if ($s['id'] === 'site_administration')
                $has_admin = true;
            if ($s['id'] === 'site_itc')
                $has_itc = true;
        }
        if ($is_billed === null || $is_billed != '0') {
            if (!$has_extras)
                $sites_rows[] = ['id' => 'site_extras', 'name' => '🌟 EXTRA BUREAU', 'is_billed' => 1];
            if (!$has_releves)
                $sites_rows[] = ['id' => 'site_releves', 'name' => '🔄 Vivier des relèves', 'is_billed' => 1];
            if (!array_filter($sites_rows, fn($s) => $s['id'] === 'site_extras_sur_site'))
                $sites_rows[] = ['id' => 'site_extras_sur_site', 'name' => '🌟 EXTRA SUR SITE', 'is_billed' => 1];
            if (!$has_admin)
                $sites_rows[] = ['id' => 'site_administration', 'name' => '🏢 Administration', 'is_billed' => 1];
            if (!$has_itc)
                $sites_rows[] = ['id' => 'site_itc', 'name' => 'ITC / IFM', 'is_billed' => 1];
        }

        $sites = $sites_rows;
        foreach ($sites as &$site) {
            $stmtSub = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR service_id IS NULL OR service_id = '')");
            $stmtSub->execute([$site['id'], $serviceKey]);
            $subs = $stmtSub->fetchAll();
            
            if (empty($subs) && in_array($site['id'], ['site_extras', 'site_releves', 'site_administration', 'site_itc'])) {
                if ($site['id'] === 'site_extras') $subs = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_releves') $subs = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                if ($site['id'] === 'site_administration') $subs = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                if ($site['id'] === 'site_itc') {
                    $comp_suffix = substr(preg_replace('/[^a-z0-9]/', '', strtolower($companyKey ?? '')), 0, 12);
                    $subs = [
                        ['id' => 'itc_tenue_' . $comp_suffix, 'name' => 'Tenue Régulière'],
                        ['id' => 'itc_costume_' . $comp_suffix, 'name' => 'Costume'],
                        ['id' => 'itc_ots_' . $comp_suffix, 'name' => 'OTS'],
                        ['id' => 'itc_special_' . $comp_suffix, 'name' => 'Agent Spécial']
                    ];
                }
            }
            $site['subsites'] = $subs ?: [];
            
            // fetch agents count
            $agents_count = 0;
            if (!empty($site['subsites'])) {
                $sub_ids = array_map(function($s) { return $s['id']; }, $site['subsites']);
                $placeholders = implode(',', array_fill(0, count($sub_ids), '?'));
                $stmtA = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE subsite_id IN ($placeholders) AND (exit_date IS NULL OR exit_date = '')");
                $stmtA->execute($sub_ids);
                $agents_count = (int) $stmtA->fetchColumn();
            }
            $site['agents_count'] = $agents_count;
        }

        echo json_encode($sites);
        break;
    case 'add_site':
        requirePermission('dashboard');
        $serviceKey = $_SESSION['service_id'] ?? null;
        $name = $data['name'] ?? '';
        $location = $data['location'] ?? 'abidjan';
        $module = $data['module'] ?? 'PC';
        $is_billed = isset($data['is_billed']) ? (int)$data['is_billed'] : 1;
        $sqlite = getDb();
        try { $sqlite->exec("ALTER TABLE sites ADD COLUMN is_billed INTEGER DEFAULT 1"); } catch (Exception $e) {}
        
        $stmt = $sqlite->prepare('SELECT COUNT(*) as c FROM sites WHERE name = ? AND service_id = ? AND source_module = ?');
        $stmt->execute([$name, $serviceKey, $module]);
        $row = $stmt->fetch();
        if ($row && $row['c'] > 0) {
            echo json_encode(['success' => false, 'message' => 'Ce site existe déjà dans ce module']);
            break;
        }

        $id = time() . '_' . rand(100, 999);
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';

        $stmtInsert = $sqlite->prepare('INSERT INTO sites (id, name, service_id, company_id, location, source_module, is_billed) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmtInsert->execute([$id, $name, $serviceKey, $company_id, $location, $module, $is_billed]);

        $stmtSubsite = $sqlite->prepare('INSERT INTO subsites (id, name, site_id, service_id, company_id) VALUES (?, ?, ?, ?, ?)');
        $stmtSubsite->execute([$id . '_1', 'Zone Principale', $id, $serviceKey, $company_id]);

        // Keep legacy sync for now until get_dashboard_init is rewritten
        $db = getScopedData($serviceKey);
        $db['sites'][] = [
            'id' => $id,
            'name' => $name,
            'subsites' => [
                ['id' => $id . '_1', 'name' => 'Zone Principale', 'agents' => []]
            ]
        ];
        saveScopedData($db, $serviceKey);

        echo json_encode(['success' => true]);
        break;
    case 'get_site_agents':
        requirePermission('dashboard');
        $site_id = $data['site_id'] ?? '';
        $sqlite = getDb();
        
        // It could be a parent site or a subsite
        $stmt = $sqlite->prepare("SELECT id, name, `function` FROM agents WHERE (subsite_id = ? OR service_id = ?) AND (exit_date IS NULL OR exit_date = '') AND (archived_period IS NULL OR archived_period = '')");
        $stmt->execute([$site_id, $site_id]);
        $agents = $stmt->fetchAll();
        
        // Also check if site_id is a parent site and fetch its subsites' agents
        $stmtSub = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
        $stmtSub->execute([$site_id]);
        $subs = $stmtSub->fetchAll();
        foreach ($subs as $sub) {
            $stmt = $sqlite->prepare("SELECT id, name, `function` FROM agents WHERE subsite_id = ? AND (exit_date IS NULL OR exit_date = '') AND (archived_period IS NULL OR archived_period = '')");
            $stmt->execute([$sub['id']]);
            $agents = array_merge($agents, $stmt->fetchAll());
        }
        
        echo json_encode(['success' => true, 'agents' => $agents]);
        break;

    case 'add_special_site':
        requirePermission('dashboard');
        $name = trim($data['name'] ?? '');
        $icon = trim($data['icon'] ?? '📋');
        $type = trim($data['type'] ?? 'custom'); // custom | extras | releves | admin
        if ($name === '') {
            echo json_encode(['success' => false, 'message' => 'Nom requis']);
            break;
        }
        $db = getScopedData($serviceKey);
        // Build a fixed, readable ID based on slugified name
        $slug = 'site_custom_' . preg_replace('/[^a-z0-9_]/', '_', strtolower($name));
        // Check uniqueness
        foreach ($db['sites'] as $s) {
            if ($s['id'] === $slug || strtolower($s['name']) === strtolower($name)) {
                echo json_encode(['success' => false, 'message' => 'Un site avec ce nom existe déjà']);
                break 2;
            }
        }
        $db['sites'][] = [
            'id' => $slug,
            'name' => $icon . ' ' . $name,
            'icon' => $icon,
            'is_special' => true,
            'special_type' => $type,
            'subsites' => [
                ['id' => $slug . '_1', 'name' => 'Agents Disponibles', 'agents' => []]
            ]
        ];
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true, 'site_id' => $slug]);
        break;
    case 'update_site_icon':
        $site_id = $data['site_id'] ?? '';
        $icon = $data['icon'] ?? '🏢';
        $db = getScopedData($serviceKey);
        foreach ($db['sites'] as &$site) {
            if ((string) $site['id'] === (string) $site_id) {
                $site['icon'] = $icon;
                break;
            }
        }
        unset($site);
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;
    case 'add_subsite':
        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $site_id = $data['site_id'] ?? 0;
        $name = $data['name'] ?? '';
        if (!$site_id || !$name) {
            echo json_encode(['success' => false, 'message' => 'Données manquantes']);
            break;
        }
        $sqlite = getDb();
        $id = 'sub_' . time() . '_' . rand(1000, 9999);
        $created_at = date('Y-m-d H:i:s');
        
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }

        try {
            // Disable foreign keys temporarily because virtual sites (e.g. site_extras_sur_site)
            // do not exist in the 'sites' table, which violates the FK constraint.
            try { $sqlite->exec('PRAGMA foreign_keys = OFF'); } catch (Throwable $t) {}
            try { $sqlite->exec('SET FOREIGN_KEY_CHECKS=0'); } catch (Throwable $t) {}
            
            $stmtSubsite = $sqlite->prepare('INSERT INTO subsites (id, name, site_id, service_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            $stmtSubsite->execute([$id, $name, $site_id, $serviceKey, $company_id, $created_at]);
            
            try { $sqlite->exec('PRAGMA foreign_keys = ON'); } catch (Throwable $t) {}
            try { $sqlite->exec('SET FOREIGN_KEY_CHECKS=1'); } catch (Throwable $t) {}
            echo json_encode(['success' => true, 'id' => $id, 'name' => $name]);
        } catch (Throwable $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur DB: ' . $e->getMessage()]);
        }
        break;
    case 'rename_site':
        requirePermission('dashboard');
        $site_id = $data['site_id'] ?? '';
        $new_name = $data['name'] ?? '';
        $sqlite = getDb();
        $stmtCheck = $sqlite->prepare("SELECT id, name FROM sites WHERE id = ?");
        $stmtCheck->execute([$site_id]);
        $row = $stmtCheck->fetch();
        $old_name = $row ? $row['name'] : '';
        
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }

        if ($row) {
            $stmt = $sqlite->prepare("UPDATE sites SET name = ?, company_id = ?, source_module = 'PC' WHERE id = ?");
            $stmt->execute([$new_name, $company_id, $site_id]);
            
            if ($old_name !== '' && $old_name !== $new_name) {
                // Mettre à jour les historiques de mutation/déploiement dans la table attendance
                $patterns = [
                    'M|',
                    'EXT_1|', 'EXT_2|', 'EXT_3|',
                    'REL_1|', 'REL_2|', 'REL_3|'
                ];
                foreach ($patterns as $prefix) {
                    $old_status = $prefix . $old_name;
                    $new_status = $prefix . $new_name;
                    $like_pattern = $old_status . '%'; // pour inclure d'éventuels suffixes si existants
                    $stmtAtt = $sqlite->prepare("UPDATE attendance SET status = REPLACE(status, ?, ?) WHERE status LIKE ?");
                    $stmtAtt->execute([$old_status, $new_status, $like_pattern]);
                }
            }
        } else {
            $stmtIns = $sqlite->prepare("INSERT INTO sites (id, name, company_id, service_id, source_module, is_billed) VALUES (?, ?, ?, ?, 'PC', 1)");
            $stmtIns->execute([$site_id, $new_name, $company_id, $serviceKey]);
        }
        
        $serviceKey = $_SESSION['service_id'] ?? null;
        if ($serviceKey) {
            $db = getScopedData($serviceKey);
            if (isset($db['sites']) && is_array($db['sites'])) {
                foreach ($db['sites'] as &$s) {
                    if ((string)$s['id'] === (string)$site_id) {
                        $s['name'] = $new_name;
                        // Ne pas oublier de retirer le `&` en sortant
                        break;
                    }
                }
                unset($s);
                saveScopedData($db, $serviceKey);
            }
        }
        
        echo json_encode(['success' => true]);
        break;
    case 'delete_site':
        requirePermission('dashboard');
        $site_id = $data['site_id'] ?? '';
        $motif = $data['motif'] ?? '';
        $is_billed = isset($data['is_billed']) ? (int)$data['is_billed'] : 1;
        if (!$site_id) {
            echo json_encode(['success' => false, 'message' => 'Site manquant']);
            break;
        }
        $sqlite = getDb();
        
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user = $_SESSION['user_name'] ?? 'Inconnu';
        
        $stmtSite = $sqlite->prepare("SELECT name FROM sites WHERE id = ?");
        $stmtSite->execute([$site_id]);
        $siteRow = $stmtSite->fetch();
        $site_name = $siteRow ? $siteRow['name'] : '';
        
        $stmtSubsites = $sqlite->prepare("SELECT id, name FROM subsites WHERE site_id = ?");
        $stmtSubsites->execute([$site_id]);
        $subsites = $stmtSubsites->fetchAll();
        
        if (empty($subsites) && $motif) {
            $stmtInsert = $sqlite->prepare("INSERT INTO contract_ruptures 
                (company_id, subsite_id, subsite_name, site_name, motif, rupture_date, effectif, montant_total, contract_rows, archived_at, archived_by, is_billed) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)");
            $stmtInsert->execute([
                $company_id, $site_id, 'Aucune zone', $site_name, $motif, date('Y-m-d'), 0, 0, '[]', $user, $is_billed
            ]);
        }

        foreach ($subsites as $sub) {
            if ($motif) {
                $stmtInsert = $sqlite->prepare("INSERT INTO contract_ruptures 
                    (company_id, subsite_id, subsite_name, site_name, motif, rupture_date, effectif, montant_total, contract_rows, archived_at, archived_by, is_billed) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)");
                $stmtInsert->execute([
                    $company_id, $sub['id'], $sub['name'], $site_name, $motif, date('Y-m-d'), 0, 0, '[]', $user, $is_billed
                ]);
            }
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id IN (SELECT id FROM agents WHERE subsite_id = ?)")->execute([$sub['id']]);
            $sqlite->prepare("DELETE FROM agents WHERE subsite_id = ?")->execute([$sub['id']]);
        }
        $sqlite->prepare("DELETE FROM subsites WHERE site_id = ?")->execute([$site_id]);
        $sqlite->prepare("DELETE FROM sites WHERE id = ?")->execute([$site_id]);
        
        echo json_encode(['success' => true]);
        break;
    case 'rename_subsite':
        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $subsite_id = $data['subsite_id'] ?? '';
        $new_name = $data['new_name'] ?? ($data['name'] ?? '');
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        
        $site_id = $data['site_id'] ?? '';
        if (!$site_id && strpos($subsite_id, 'default_') === 0) {
            $site_id = substr($subsite_id, 8); // remove 'default_' prefix
        }
        
        if (!$subsite_id || !$new_name) {
            echo json_encode(['success' => false, 'message' => 'Données manquantes']);
            break;
        }

        $sqlite = getDb();
        
        // Mettre à jour par id uniquement — vérifier les droits via la table sites parente ou autoriser les sites virtuels
        $stmt = $sqlite->prepare("UPDATE subsites SET name = ? WHERE id = ? AND (company_id = ? OR company_id IS NULL OR company_id = '')");
        $stmt->execute([$new_name, $subsite_id, $company_id]);
        
        // Fallback pour les zones hardcodées (extras, releves, admin) — créer en base si inexistantes
        if ($stmt->rowCount() === 0 && in_array($subsite_id, ['site_admin_1', 'site_extras_1', 'site_releves_1'])) {
            $fallback_site_id = '';
            if ($subsite_id === 'site_admin_1') $fallback_site_id = 'site_administration';
            elseif ($subsite_id === 'site_extras_1') $fallback_site_id = 'site_extras';
            elseif ($subsite_id === 'site_releves_1') $fallback_site_id = 'site_releves';
            
            $stmtIns = $sqlite->prepare('INSERT OR REPLACE INTO subsites (id, name, site_id, service_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            $stmtIns->execute([$subsite_id, $new_name, $fallback_site_id, $serviceKey, $company_id, date('Y-m-d H:i:s')]);
        }
        
        // Fallback pour les zones par défaut (default_)
        if ($stmt->rowCount() === 0 && strpos($subsite_id, 'default_') === 0) {
            if ($site_id) {
                $stmtIns = $sqlite->prepare('INSERT OR REPLACE INTO subsites (id, name, site_id, service_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
                $stmtIns->execute([$subsite_id, $new_name, $site_id, $serviceKey, $company_id, date('Y-m-d H:i:s')]);
            }
        }

        // Fallback pour les zones ITC virtuelles (itc_tenue_*, itc_costume_*, itc_as_*, itc_ots_*)
        if ($stmt->rowCount() === 0 && (strpos($subsite_id, 'itc_') === 0 || in_array($subsite_id, ['site_itc_tenue', 'site_itc_costume', 'site_itc_as']))) {
            // Essayer d'abord une UPDATE sans filtre service_id ni company_id
            $stmtFallback = $sqlite->prepare("UPDATE subsites SET name = ? WHERE id = ?");
            $stmtFallback->execute([$new_name, $subsite_id]);
            
            // Si toujours 0 ligne → la zone est virtuelle, on l'insère en base avec le bon nom
            if ($stmtFallback->rowCount() === 0) {
                $stmtInsItc = $sqlite->prepare("INSERT IGNORE INTO subsites (id, name, site_id, service_id, company_id) VALUES (?, ?, 'site_itc', '', ?)");
                $stmtInsItc->execute([$subsite_id, $new_name, $company_id]);
            }
        }

        echo json_encode(['success' => true]);
        break;
    case 'update_subsite_config':
        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $subsite_id = $data['subsite_id'] ?? '';
        $site_id = $data['site_id'] ?? '';
        $name = $data['name'] ?? '';
        $costume_enabled = isset($data['costume_enabled']) && $data['costume_enabled'] ? 1 : 0;
        $enabled_functions = isset($data['enabled_functions']) && is_array($data['enabled_functions']) ? json_encode($data['enabled_functions']) : '[]';
        $contract_end_date = isset($data['contract_end_date']) && $data['contract_end_date'] ? $data['contract_end_date'] : null;
        $contract_end_motif = isset($data['contract_end_motif']) && $data['contract_end_motif'] ? $data['contract_end_motif'] : null;
        $sqlite = getDb();
        
        if ($site_id && $name) {
            $company_id = $_SESSION['company_id'] ?? '';
            $serviceKey = $_SESSION['service_id'] ?? '';
            $stmtIns = $sqlite->prepare('INSERT IGNORE INTO subsites (id, name, site_id, service_id, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
            $stmtIns->execute([$subsite_id, $name, $site_id, $serviceKey, $company_id, date('Y-m-d H:i:s')]);
        }
        
        $chk = $sqlite->prepare("SELECT contract_end_date FROM subsites WHERE id = ?");
        $chk->execute([$subsite_id]);
        $row = $chk->fetch();
        $old_date = $row['contract_end_date'] ?? null;

        if ($contract_end_date !== $old_date) {
            $stmt = $sqlite->prepare("UPDATE subsites SET costume_enabled = ?, enabled_functions = ?, contract_end_date = ?, contract_end_motif = ?, contract_end_updated_at = CURRENT_TIMESTAMP, closure_notified = 0, closure_last_reminder_at = NULL WHERE id = ?");
            $stmt->execute([$costume_enabled, $enabled_functions, $contract_end_date, $contract_end_motif, $subsite_id]);
        } else {
            $stmt = $sqlite->prepare("UPDATE subsites SET costume_enabled = ?, enabled_functions = ?, contract_end_date = ?, contract_end_motif = ? WHERE id = ?");
            $stmt->execute([$costume_enabled, $enabled_functions, $contract_end_date, $contract_end_motif, $subsite_id]);
        }
        // Log the result to a file to debug
        $chk = $sqlite->prepare("SELECT contract_end_date FROM subsites WHERE id = ?");
        $chk->execute([$subsite_id]);
        $row = $chk->fetch();
        error_log("RUPTURE_DEBUG: Updated $subsite_id. Sent: $contract_end_date. DB: " . ($row['contract_end_date'] ?? 'NULL'));
        
        echo json_encode(['success' => true]);
        break;
    case 'delete_subsite':
        if (!hasPermission('dashboard') && !hasPermission('salaries') && !hasPermission('fluctuation')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $serviceKey = $_SESSION['service_id'] ?? null;
        $subsite_id = $data['subsite_id'] ?? '';
        if (!$subsite_id) {
            echo json_encode(['success' => false, 'message' => 'Sous-site manquant']);
            break;
        }

        if (strpos((string) $subsite_id, 'mutated_') === 0) {
            echo json_encode(['success' => false, 'message' => 'Sous-site temporaire non supprimable']);
            break;
        }

        $sqlite = getDb();
        $motif = $data['motif'] ?? '';
        $is_billed = isset($data['is_billed']) ? (int)$data['is_billed'] : 1;
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $user = $_SESSION['user_name'] ?? 'Inconnu';
        
        if ($motif) {
            $stmtSub = $sqlite->prepare("SELECT s.name as subsite_name, p.name as site_name FROM subsites s JOIN sites p ON s.site_id = p.id WHERE s.id = ?");
            $stmtSub->execute([$subsite_id]);
            $subInfo = $stmtSub->fetch();
            if ($subInfo) {
                $stmtInsert = $sqlite->prepare("INSERT INTO contract_ruptures 
                    (company_id, subsite_id, subsite_name, site_name, motif, rupture_date, effectif, montant_total, contract_rows, archived_at, archived_by, is_billed) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)");
                $stmtInsert->execute([
                    $company_id, $subsite_id, $subInfo['subsite_name'], $subInfo['site_name'], $motif, date('Y-m-d'), 0, 0, '[]', $user, $is_billed
                ]);
            }
        }

        // Fetch agents to delete their attendance
        $stmtAgents = $sqlite->prepare("SELECT id FROM agents WHERE subsite_id = ? AND service_id = ?");
        $stmtAgents->execute([$subsite_id, $serviceKey]);
        $agents = $stmtAgents->fetchAll();

        if (!empty($agents)) {
            $placeholders = str_repeat('?,', count($agents) - 1) . '?';
            $agent_ids = array_map(function ($a) {
                return $a['id']; }, $agents);

            // Delete attendance
            $sqlite->prepare("DELETE FROM attendance WHERE agent_id IN ($placeholders)")->execute($agent_ids);

            // Delete agents
            $sqlite->prepare("DELETE FROM agents WHERE subsite_id = ? AND service_id = ?")->execute([$subsite_id, $serviceKey]);
        }

        // Delete subsite
        $sqlite->prepare("DELETE FROM subsites WHERE id = ?")->execute([$subsite_id]);


        echo json_encode(['success' => true]);
        break;
    case 'get_site_data':
        $site_id = $_GET['site_id'] ?? 0;
        $period = $_GET['period'] ?? date('Y-m');

        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        $company_id = $_SESSION['company_id'] ?? null;
        
        // SECURITE : Vérifier si le mois est verrouillé
        $stmtLock = $sqlite->prepare("SELECT password_hash FROM period_passwords WHERE company_id = ? AND period = ?");
        $stmtLock->execute([$company_id, $period]);
        $lockData = $stmtLock->fetch();
        if ($lockData && !empty($lockData['password_hash'])) {
            if (empty($_SESSION['unlocked_periods'][$company_id][$period])) {
                echo json_encode(['locked' => true, 'period' => $period]);
                exit;
            }
        }
        
        $site_data = [];

        if ($site_id !== null && $site_id !== '' && $serviceKey) {
            $is_hardcoded = in_array($site_id, ['site_extras', 'site_extras_sur_site', 'site_releves', 'site_administration', 'site_itc']);

            if ($is_hardcoded) {
                $site = ['id' => $site_id, 'name' => ''];
                if ($site_id === 'site_extras')
                    $site['name'] = '🌟 EXTRA BUREAU';
                if ($site_id === 'site_extras_sur_site')
                    $site['name'] = '⭐ EXTRA SUR SITE';
                if ($site_id === 'site_releves')
                    $site['name'] = '🔄 Vivier des relèves';
                if ($site_id === 'site_administration')
                    $site['name'] = '🏢 Administration';
                if ($site_id === 'site_itc')
                    $site['name'] = 'ITC / IFM';

                // Fetch subsites avec isolation complète par company_id
                if ($site_id === 'site_itc') {
                    // ITC/IFM : chaque entreprise a ses propres zones, filtrées par company_id
                    $comp_suffix = substr(preg_replace('/[^a-z0-9]/', '', strtolower($company_id)), 0, 12);
                    $stmtItcComp = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = 'site_itc' AND company_id = ? ORDER BY created_at ASC");
                    $stmtItcComp->execute([$company_id]);
                    $itc_comp = $stmtItcComp->fetchAll();
                    if (!empty($itc_comp)) {
                        $subsites_rows = $itc_comp;
                    } else {
                        // Première ouverture pour cette entreprise → créer les 3 zones par défaut
                        $default_zones = [
                            ['id' => 'itc_tenue_' . $comp_suffix, 'name' => 'Tenue Reguliere'],
                            ['id' => 'itc_costume_' . $comp_suffix, 'name' => 'Costume'],
                            ['id' => 'itc_as_' . $comp_suffix, 'name' => 'Agent Special'],
                            ['id' => 'itc_ots_' . $comp_suffix, 'name' => 'OTS']
                        ];
                        try {
                            $stmtIns = $sqlite->prepare("INSERT IGNORE INTO subsites (id, name, site_id, service_id, company_id) VALUES (?, ?, 'site_itc', '', ?)");
                            foreach ($default_zones as $dz) {
                                $stmtIns->execute([$dz['id'], $dz['name'], $company_id]);
                            }
                        } catch (Exception $e) { /* Ignore */ }
                        $subsites_rows = $default_zones;
                    }
                } else {
                    $stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR company_id = ? OR service_id IS NULL OR service_id = '')");
                    $stmt->execute([$site_id, $serviceKey, $company_id]);
                    $subsites_rows = $stmt->fetchAll();

                    if (empty($subsites_rows)) {
                        if ($site_id === 'site_extras') {
                            $subsites_rows = [['id' => 'site_extras_1', 'name' => 'Agents Disponibles']];
                        } elseif ($site_id === 'site_releves') {
                            $subsites_rows = [['id' => 'site_releves_1', 'name' => 'Agents Disponibles']];
                        } elseif ($site_id === 'site_administration') {
                            $subsites_rows = [['id' => 'site_admin_1', 'name' => 'Bureau']];
                        } else {
                            $subsites_rows = [['id' => 'default_' . $site_id, 'name' => 'Zone Principale']];
                        }
                    } else {
                        // Ensure 'default_' . $site_id is also checked if it contains agents
                        $subsites_rows[] = ['id' => 'default_' . $site_id, 'name' => 'Agents non assignés (Par défaut)'];
                    }
                }
            } else {
                // Charger par company_id pour que le PC puisse accéder aux sites créés par l'admin
                $stmt = $sqlite->prepare("SELECT * FROM sites WHERE id = ? AND (service_id = ? OR company_id = ?) AND source_module != 'FACTURATION'");
                $stmt->execute([$site_id, $serviceKey, $company_id]);
                $site = $stmt->fetch();

                if ($site) {
                    $stmt = $sqlite->prepare("SELECT * FROM subsites WHERE site_id = ? AND (service_id = ? OR company_id = ? OR service_id IS NULL OR service_id = '')");
                    $stmt->execute([$site_id, $serviceKey, $company_id]);
                    $subsites_rows = $stmt->fetchAll();

                    // Auto-fix: Create missing default subsite in DB for normal sites so it becomes a REAL zone
                    $default_id = 'default_' . $site_id;
                    $has_default = false;
                    foreach ($subsites_rows as $sr) {
                        if ($sr['id'] === $default_id) {
                            $has_default = true;
                            break;
                        }
                    }
                    if (!$has_default) {
                        $stmtCheck = $sqlite->prepare("SELECT COUNT(*) FROM agents WHERE subsite_id = ? AND company_id = ?");
                        $stmtCheck->execute([$default_id, $company_id]);
                        $has_orphans = $stmtCheck->fetchColumn() > 0;
                        if (empty($subsites_rows) || $has_orphans) {
                            $stmtIns = $sqlite->prepare("INSERT IGNORE INTO subsites (id, name, site_id, service_id, company_id) VALUES (?, 'Zone Principale', ?, ?, ?)");
                            $stmtIns->execute([$default_id, $site_id, $serviceKey, $company_id]);
                            $stmt->execute([$site_id, $serviceKey, $company_id]);
                            $subsites_rows = $stmt->fetchAll();
                        }
                    }
                }
            }

            if ($site) {
                $site_name = $site['name'];

                $subsites = [];
                foreach ($subsites_rows as $sub) {
                    $sub['enabled_functions'] = json_decode($sub['enabled_functions'] ?? '[]', true);

                    // Cacher la zone si la date de fin de contrat est strictement antérieure au mois en cours
                    if (!empty($sub['contract_end_date'])) {
                        $end_month = substr($sub['contract_end_date'], 0, 7);
                        if ($end_month < $period) {
                            continue;
                        }
                    }

                    // Charger agents par company_id pour que le PC voie les agents de tous les services, mais en filtrant les archivés
                    $stmt_ag = $sqlite->prepare("SELECT * FROM agents WHERE subsite_id = ? AND company_id = ? AND (archived_period IS NULL OR archived_period >= ?) ORDER BY created_at ASC");
                    $stmt_ag->execute([$sub['id'], $company_id, $period]);
                    $agents_rows = $stmt_ag->fetchAll() ?: [];

                    $agents = [];
                    $agent_ids = [];
                    foreach ($agents_rows as $ag) {
                        $agent_ids[] = "'" . str_replace("'", "''", $ag['id']) . "'";
                    }

                    $all_attendances = [];
                    $all_reps = [];
                    $all_funcs = [];

                    if (!empty($agent_ids)) {
                        $inAgents = implode(',', $agent_ids);
                        $stmt_att = $sqlite->prepare("SELECT agent_id, date, shift_code, status FROM attendance WHERE agent_id IN ($inAgents) AND period = ?");
                        $stmt_att->execute([$period]);
                        $raw_atts = $stmt_att->fetchAll() ?: [];
                        $stmt_reps = $sqlite->prepare("SELECT agent_id, date_supp, agent_remplace, vacation FROM supplementaires_externes WHERE agent_id IN ($inAgents) AND periode = ?");
                        $stmt_reps->execute([$period]);
                        $raw_reps = $stmt_reps->fetchAll() ?: [];
                        $all_reps_by_date = [];
                        $all_reps = [];
                        foreach ($raw_reps as $rep) {
                            $all_reps_by_date[$rep['agent_id']][$rep['date_supp']] = [
                                'rep' => $rep['agent_remplace'],
                                'vac' => $rep['vacation']
                            ];
                            $all_reps[$rep['agent_id']][] = $rep['agent_remplace'];
                        }

                        $stmt_all_funcs = $sqlite->prepare("SELECT id, name, `function` FROM agents WHERE company_id = ?");
                        $stmt_all_funcs->execute([$company_id]);
                        $raw_funcs = $stmt_all_funcs->fetchAll() ?: [];
                        foreach ($raw_funcs as $rf) {
                            $all_funcs[$rf['name']] = $rf['function'];
                            $all_funcs[$rf['id']] = $rf['function'];
                        }

                        foreach ($raw_atts as $att) {
                            $vac = '';
                            if (strpos($att['status'], 'Suppl|') === 0) {
                                $aid = $att['agent_id'];
                                $d = $att['date'];
                                if (isset($all_reps_by_date[$aid][$d])) {
                                    $repData = $all_reps_by_date[$aid][$d];
                                    $repNameOrId = $repData['rep'];
                                    $vac = $repData['vac'];
                                    $repFunc = $all_funcs[$repNameOrId] ?? '';
                                    if ($repFunc) {
                                        $parts = explode('|', $att['status']);
                                        $dest = $parts[1] ?? '';
                                        $att['status'] = "Suppl|$dest|||$repFunc";
                                    }
                                }
                                
                                // ON-THE-FLY conversion for old 'S' records of 24H/48H/72H
                                if ($att['shift_code'] === 'S' && in_array(strtoupper($vac), ['24H', '48H', '72H'])) {
                                    $attSJ = $att; $attSJ['shift_code'] = 'SJ';
                                    $attSN = $att; $attSN['shift_code'] = 'SN';
                                    $all_attendances[$att['agent_id']][] = $attSJ;
                                    $all_attendances[$att['agent_id']][] = $attSN;
                                    continue;
                                }
                            }
                            $all_attendances[$att['agent_id']][] = $att;
                        }


                    }

                    foreach ($agents_rows as $agent) {
                        $agent['has_sp'] = (int) $agent['has_sp'];
                        if (isset($agent['shift_history']) && is_string($agent['shift_history'])) {
                            $agent['shift_history'] = json_decode($agent['shift_history'], true) ?: [];
                        } else {
                            $agent['shift_history'] = [];
                        }
                        $agent['profile_data'] = json_decode($agent['profile_data'] ?? '{}', true);

                        
                        $agent['attendance'] = $all_attendances[$agent['id']] ?? [];

                        $replaced_functions = [];
                        if (isset($all_reps[$agent['id']])) {
                            foreach ($all_reps[$agent['id']] as $repName) {
                                if (!empty($repName) && isset($all_funcs[$repName])) {
                                    $replaced_functions[] = $all_funcs[$repName];
                                }
                            }
                        }
                        $agent['replaced_functions'] = array_values(array_unique($replaced_functions));

                        $agents[] = $agent;
                    }

                    // Ne pas inclure le sous-site par défaut s'il est vide et qu'il y a d'autres sous-sites
                    $is_default_name = in_array($sub['name'], ['Agents non assignés (Par défaut)', 'Zone Principale', 'Agents Disponibles', 'Bureau', 'Staff Administratif']);
                    if (strpos($sub['id'], 'default_') === 0 && empty($agents) && count($subsites) > 0 && $is_default_name) {
                        continue;
                    }

                    $sub['agents'] = $agents;
                    $subsites[] = $sub;
                }
                unset($sub); // Prevents reference bugs in subsequent loops

                // Récupérer les agents de relève ou extras programmés sur ce site
                $mutated_agents = [];
                $deployed_extras = [];

                $suppl_conditions = [];
                $suppl_params = [];
                $suppl_conditions[] = "a.status LIKE ?";
                $suppl_params[] = 'Suppl|' . $site_id . '|%';
                foreach ($subsites_rows as $sb) {
                    if (isset($sb['id'])) {
                        $suppl_conditions[] = "a.status LIKE ?";
                        $suppl_params[] = 'Suppl|' . $sb['id'] . '|%';
                    }
                }
                $suppl_sql = implode(' OR ', $suppl_conditions);
                if (empty($suppl_sql)) $suppl_sql = "1=0";

                $stmt_mut = $sqlite->prepare("
                   SELECT DISTINCT a.agent_id, ag.*
                   FROM attendance a
                   JOIN agents ag ON a.agent_id = ag.id
                   WHERE ag.company_id = ?
                   AND a.period = ?
                   AND (a.status LIKE ? OR a.status LIKE ? OR a.status LIKE ? OR ($suppl_sql))
               ");

                $like_m = 'M|' . $site_name;
                $like_ext = 'EXT%|' . $site_name;
                $like_rel = 'REL%|' . $site_name;

                $params = [$company_id, $period, $like_m, $like_ext, $like_rel];
                foreach ($suppl_params as $sp) {
                    $params[] = $sp;
                }

                $stmt_mut->execute($params);
                $mutated_rows = $stmt_mut->fetchAll();

                $subsite_ids = array_column($subsites_rows, 'id');

                foreach ($mutated_rows as $agent) {
                    $stmt_orig = $sqlite->prepare("SELECT s.name, s.id FROM sites s JOIN subsites sub ON sub.site_id = s.id WHERE sub.id = ?");
                    $stmt_orig->execute([$agent['subsite_id']]);
                    $orig_site = $stmt_orig->fetch();
                    if (!$orig_site && strpos($agent['subsite_id'], 'default_') === 0) {
                        $fallback_site_id = substr($agent['subsite_id'], 8);
                        $stmt_fallback = $sqlite->prepare("SELECT name, id FROM sites WHERE id = ?");
                        $stmt_fallback->execute([$fallback_site_id]);
                        $orig_site = $stmt_fallback->fetch();
                    }

                    if (!$orig_site) {
                        $orig_site = ['name' => 'Site Inconnu', 'id' => 'unknown'];
                    }

                    // Vérifier si l'agent a un "programme de la semaine" actif sur ce site
                    $is_scheduled_here = false;
                    $stmt_check_sched = $sqlite->prepare("SELECT COUNT(*) FROM agent_schedules WHERE agent_id = ? AND target_site_id = ?");
                    $stmt_check_sched->execute([$agent['id'], $site_id]);
                    if ($stmt_check_sched->fetchColumn() > 0) {
                        $is_scheduled_here = true;
                    }

                    if ($orig_site && !$is_scheduled_here) {
                        $stmt_att = $sqlite->prepare("SELECT date, shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
                        $stmt_att->execute([$agent['id'], $period]);

                        $mutated_agent = $agent;
                        $mutated_agent['has_sp'] = (int) $mutated_agent['has_sp'];
                        if (isset($mutated_agent['shift_history']) && is_string($mutated_agent['shift_history'])) {
                            $mutated_agent['shift_history'] = json_decode($mutated_agent['shift_history'], true) ?: [];
                        } else {
                            $mutated_agent['shift_history'] = [];
                        }
                        $mutated_agent['profile_data'] = json_decode($mutated_agent['profile_data'] ?? '{}', true);
                        
                        $stmt_vac = $sqlite->prepare("SELECT vacation FROM supplementaires_externes WHERE agent_id = ? AND (site_destination_id = ? OR site_destination_id IN (SELECT id FROM subsites WHERE site_id = ?)) AND periode = ? ORDER BY date_supp DESC LIMIT 1");
                        $stmt_vac->execute([$agent['id'], $site_id, $site_id, $period]);
                        $vac = $stmt_vac->fetchColumn();
                        if ($vac && empty($mutated_agent['is_extra']) && empty($mutated_agent['is_releve'])) {
                            $mutated_agent['shift_type'] = $vac;
                        }
                        
                        $attendance = $stmt_att->fetchAll() ?: [];
                        $filtered_att = [];

                        $is_relevant = false;
                        $target_subsite_id = null;
                        foreach ($attendance as $att) {
                            if (strpos($att['status'], 'M|' . $site_name) === 0 || 
                                strpos($att['status'], 'EXT_1|' . $site_name) === 0 || 
                                strpos($att['status'], 'REL_1|' . $site_name) === 0) {
                                $is_relevant = true;
                                // Ignore same-site standard mutations from mutated_agents
                                if ($orig_site['id'] === $site_id) {
                                    $is_relevant = false;
                                }
                                $filtered_att[] = $att;
                            } else if (strpos($att['status'], 'Suppl|') === 0) {
                                $dest = explode('|', $att['status'])[1] ?? '';
                                if (in_array($dest, $subsite_ids) || $dest === $site_id) {
                                    $is_relevant = true;
                                    if (in_array($dest, $subsite_ids) && !$target_subsite_id) {
                                        $target_subsite_id = $dest;
                                    }
                                    
                                    // ON-THE-FLY conversion for old 'S' records of 24H/48H/72H
                                    if ($att['shift_code'] === 'S' && $vac && in_array(strtoupper($vac), ['24H', '48H', '72H'])) {
                                        $attSJ = [
                                            'date' => $att['date'],
                                            'shift_code' => 'SJ',
                                            'status' => 'Suppl_Dest'
                                        ];
                                        $attSN = [
                                            'date' => $att['date'],
                                            'shift_code' => 'SN',
                                            'status' => 'Suppl_Dest'
                                        ];
                                        $filtered_att[] = $attSJ;
                                        $filtered_att[] = $attSN;
                                        $mutated_agent['has_sp'] = 2;
                                        continue;
                                    }
                                    
                                    $filtered_att[] = [
                                        'date' => $att['date'],
                                        'shift_code' => $att['shift_code'],
                                        'status' => 'Suppl_Dest'
                                    ];
                                    if (in_array($att['shift_code'], ['SJ', 'SN'])) {
                                        $mutated_agent['has_sp'] = 2;
                                    } elseif (empty($mutated_agent['has_sp'])) {
                                        $mutated_agent['has_sp'] = 1;
                                    }
                                } else {
                                    $filtered_att[] = [
                                        'date' => $att['date'],
                                        'shift_code' => $att['shift_code'],
                                        'status' => ''
                                    ];
                                }
                            } else {
                                $filtered_att[] = [
                                    'date' => $att['date'],
                                    'shift_code' => $att['shift_code'],
                                    'status' => ''
                                ];
                            }
                        }
                        if (!$is_relevant) continue;
                        
                        $mutated_agent['attendance'] = $filtered_att;
                        $mutated_agent['is_mutated'] = true;
                        $mutated_agent['original_site'] = $orig_site['name'];
                        $mutated_agent['target_subsite_id'] = $target_subsite_id ?? null;

                        if (strpos($orig_site['id'], 'site_extras') !== false) {
                            $mutated_agent['is_extra'] = true;
                            $deployed_extras[] = $mutated_agent;
                        } elseif (strpos($orig_site['id'], 'site_releves') !== false) {
                            $mutated_agent['is_releve'] = true;
                            $deployed_extras[] = $mutated_agent;
                        } else {
                            $mutated_agents[] = $mutated_agent;
                        }
                    }
                }

                foreach ($mutated_agents as $ma) {
                    $added = false;
                    if (!empty($ma['target_subsite_id'])) {
                        foreach ($subsites as &$sub) {
                            if ($sub['id'] === $ma['target_subsite_id']) {
                                $sub['agents'][] = $ma;
                                $added = true;
                                break;
                            }
                        }
                        unset($sub);
                    }
                    if (!$added) {
                        if (!empty($subsites) && isset($subsites[0])) {
                            $subsites[0]['agents'][] = $ma;
                        } else {
                            $subsites[] = [
                                'id' => 'default_' . $site_id,
                                'name' => 'Zone par défaut',
                                'agents' => [$ma]
                            ];
                        }
                    }
                }

                if (!empty($deployed_extras)) {
                    usort($deployed_extras, function ($a, $b) {
                        $is_releve_a = isset($a['is_releve']) && $a['is_releve'] ? 1 : 0;
                        $is_releve_b = isset($b['is_releve']) && $b['is_releve'] ? 1 : 0;
                        if ($is_releve_a !== $is_releve_b)
                            return $is_releve_b - $is_releve_a;
                        return strcmp($a['name'], $b['name']);
                    });
                    foreach ($deployed_extras as $ma) {
                        $added = false;
                        if (!empty($ma['target_subsite_id'])) {
                            foreach ($subsites as &$sub) {
                                if ($sub['id'] === $ma['target_subsite_id']) {
                                    $sub['agents'][] = $ma;
                                    $added = true;
                                    break;
                                }
                            }
                            unset($sub);
                        }
                        if (!$added) {
                            if (!empty($subsites) && isset($subsites[0])) {
                                $subsites[0]['agents'][] = $ma;
                            } else {
                                $subsites[] = [
                                    'id' => 'default_' . $site_id,
                                    'name' => 'Zone par défaut',
                                    'agents' => [$ma]
                                ];
                            }
                        }
                    }
                }

                // Scheduled Relèves
                $scheduled_releves = [];
                $stmt_sched = $sqlite->prepare("
                    SELECT s.day_of_week, s.target_subsite_id, ag.*
                    FROM agent_schedules s
                    JOIN agents ag ON s.agent_id = ag.id
                    WHERE s.target_site_id = ? AND ag.company_id = ?
                ");
                $stmt_sched->execute([$site_id, $company_id]);
                $sched_rows = $stmt_sched->fetchAll();
                
                $releve_agents_map = [];
                foreach ($sched_rows as $row) {
                    $ag_id = $row['id'];
                    if (!isset($releve_agents_map[$ag_id])) {
                        $releve_agents_map[$ag_id] = $row;
                        $releve_agents_map[$ag_id]['scheduled_days'] = [];
                        $releve_agents_map[$ag_id]['scheduled_days_by_subsite'] = [];
                        $releve_agents_map[$ag_id]['target_subsites'] = [];
                        $releve_agents_map[$ag_id]['is_scheduled_releve'] = true;
                        $releve_agents_map[$ag_id]['is_releve'] = true;
                        
                        $stmt_att = $sqlite->prepare("SELECT * FROM attendance WHERE agent_id = ? AND period = ?");
                        $stmt_att->execute([$ag_id, $period]);
                        $releve_agents_map[$ag_id]['attendance'] = $stmt_att->fetchAll() ?: [];
                        
                        $releve_agents_map[$ag_id]['profile_data'] = json_decode($row['profile_data'] ?? '{}', true);
                    }
                    $releve_agents_map[$ag_id]['scheduled_days'][] = $row['day_of_week'];
                    
                    $sub_key = !empty($row['target_subsite_id']) ? $row['target_subsite_id'] : 'default';
                    if (!isset($releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key])) {
                        $releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key] = [];
                    }
                    $releve_agents_map[$ag_id]['scheduled_days_by_subsite'][$sub_key][] = $row['day_of_week'];

                    if (!empty($row['target_subsite_id']) && !in_array($row['target_subsite_id'], $releve_agents_map[$ag_id]['target_subsites'])) {
                        $releve_agents_map[$ag_id]['target_subsites'][] = $row['target_subsite_id'];
                    }
                }
                
                $scheduled_releves = array_values($releve_agents_map);

                if (!empty($scheduled_releves)) {
                    foreach ($scheduled_releves as $rel_agent) {
                        $target_subs = $rel_agent['target_subsites'] ?? [];
                        if (empty($target_subs)) {
                            if (!empty($subsites)) {
                                $subsites[0]['agents'][] = $rel_agent;
                            } else {
                                $subsites[] = [
                                    'id' => 'default_' . $site_id,
                                    'name' => 'Zone par défaut',
                                    'agents' => [$rel_agent]
                                ];
                            }
                        } else {
                            $added = false;
                            foreach ($subsites as $k => $s) {
                                if (in_array($s['id'], $target_subs)) {
                                    $subsites[$k]['agents'][] = $rel_agent;
                                    $added = true;
                                }
                            }
                            if (!$added && !empty($subsites)) {
                                $subsites[0]['agents'][] = $rel_agent;
                            } elseif (!$added) {
                                $subsites[] = [
                                    'id' => 'default_' . $site_id,
                                    'name' => 'Zone par défaut',
                                    'agents' => [$rel_agent]
                                ];
                            }
                        }
                    }
                }

                $site_data = $subsites;
            }
        }

        echo json_encode($site_data);
        break;
    case 'add_agent':
        $site_id = (string) ($data['site_id'] ?? '');
        $subsite_id = (string) ($data['subsite_id'] ?? '');
        $name = $data['name'] ?? '';
        $function = $data['function'] ?? 'AS';
        $shift_type = $data['shift_type'] ?? 'Jour';
        $period = $data['period'] ?? '';
        $contract_end_date = $data['contract_end_date'] ?? null;

        $sqlite = getDb();
        $serviceKey = resolveCurrentServiceKeySql();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        
        // Derive correct service_id from the chosen subsite if possible
        if ($subsite_id) {
            $stmtSite = $sqlite->prepare("SELECT site_id, service_id FROM subsites WHERE id = ?");
            $stmtSite->execute([$subsite_id]);
            $subData = $stmtSite->fetch();
            if ($subData) {
                if (!empty($subData['service_id'])) {
                    $serviceKey = $subData['service_id'];
                } else {
                    $actual_site_id = $subData['site_id'];
                    $stmtService = $sqlite->prepare("SELECT service_id FROM sites WHERE id = ?");
                    $stmtService->execute([$actual_site_id]);
                    $siteData = $stmtService->fetch();
                    if ($siteData && !empty($siteData['service_id'])) {
                        $serviceKey = $siteData['service_id'];
                    }
                }
            }
        }
        
        $new_agent_id = uniqid();
        // Hériter de la configuration spéciale du comptable (fonction et salaire)
        $stmtSpecial = $sqlite->prepare("SELECT `function`, salary FROM agents WHERE name LIKE ? AND company_id = ? AND salary IS NOT NULL AND salary > 0 LIMIT 1");
        $stmtSpecial->execute([$name, $company_id]);
        $specialConfig = $stmtSpecial->fetch();
        
        $salary = null;
        if ($specialConfig) {
            $function = $specialConfig['function'];
            $salary = $specialConfig['salary'];
        }

        // Vérification Liste Noire
        $stmtBlacklist = $sqlite->prepare("SELECT id FROM agents WHERE name LIKE ? AND company_id = ? AND is_blacklisted = 1 LIMIT 1");
        $stmtBlacklist->execute([$name, $company_id]);
        if ($stmtBlacklist->fetch()) {
             echo json_encode(['success' => false, 'message' => "Impossible d'ajouter cet agent : il figure sur la liste noire de l'entreprise."]);
             break;
        }

        $admin_schedule = isset($data['adminSchedule']) && $data['adminSchedule'] ? true : false;
        $admin_schedule_days = isset($data['adminScheduleDays']) ? $data['adminScheduleDays'] : [];
        $special_service = isset($data['specialService']) && $data['specialService'] ? true : false;
        $special_service_base = isset($data['specialServiceBase']) ? (int)$data['specialServiceBase'] : 12;
        $special_service_days = isset($data['specialServiceDays']) ? $data['specialServiceDays'] : [];
        
        $profile_data = json_encode([
            'admin_schedule' => $admin_schedule,
            'admin_schedule_days' => $admin_schedule_days,
            'special_service' => $special_service,
            'special_service_base' => $special_service_base,
            'special_service_days' => $special_service_days
        ]);

        $hire_date = $data['hire_date'] ?? date('Y-m-d');
        
        $stmtAgent = $sqlite->prepare('INSERT INTO agents (id, name, `function`, shift_type, has_sp, hire_date, recruitment_cost, subsite_id, service_id, company_id, salary, contract_end_date, profile_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmtAgent->execute([$new_agent_id, $name, $function, $shift_type, 0, $hire_date, 45000, $subsite_id, $serviceKey, $company_id, $salary, $contract_end_date, $profile_data]);

        // Sauvegarde du programme (relèves)
        $schedule = $data['schedule'] ?? null;
        if (is_array($schedule)) {
            $stmtSched = $sqlite->prepare("INSERT INTO agent_schedules (agent_id, day_of_week, target_site_id, target_subsite_id) VALUES (?, ?, ?, ?)");
            foreach ($schedule as $day => $target) {
                if (!empty($target['site_id'])) {
                    $stmtSched->execute([$new_agent_id, $day, $target['site_id'], $target['subsite_id'] ?? null]);
                }
            }
        }

        $db = getScopedData($serviceKey);
        if ($period !== '') {
            applyShiftDefaultsForPeriod($db, $new_agent_id, $period, $shift_type, $admin_schedule, $special_service, $special_service_days, $admin_schedule_days);

            // Appliquer les mutations (REL_1) du programme sur les présences par défaut
            if (is_array($schedule)) {
                $parts = explode('/', $period);
                if (count($parts) === 2) {
                    $month = (int)$parts[0];
                    $year = (int)$parts[1];
                    $num_days = cal_days_in_month(CAL_GREGORIAN, $month, $year);
                    $dates_by_day = []; 
                    for ($d = 1; $d <= 7; $d++) $dates_by_day[$d] = [];
                    for ($i = 1; $i <= $num_days; $i++) {
                        $dateStr = sprintf("%04d-%02d-%02d", $year, $month, $i);
                        $dow = date('N', strtotime($dateStr));
                        $dates_by_day[$dow][] = $dateStr;
                    }

                    $expected_status_by_date = [];
                    foreach ($schedule as $day => $target) {
                        $s_id = $target['site_id'];
                        $site_name = '';
                        foreach ($db['sites'] as $s) {
                            if ((string)$s['id'] === (string)$s_id) {
                                $site_name = $s['name'];
                                break;
                            }
                        }
                        if ($site_name && isset($dates_by_day[$day])) {
                            foreach ($dates_by_day[$day] as $dt) {
                                $s_sub_id = $target['subsite_id'] ?? '';
                                $expected_status_by_date[$dt] = "REL_1|{$site_name}|{$s_id}|{$s_sub_id}|";
                            }
                        }
                    }

                    // Remplacer dans le db array (qui sera inséré juste après)
                    $shift_key = ($shift_type === 'Nuit') ? 'N' : 'J';
                    foreach ($expected_status_by_date as $dt => $status) {
                        if ($status !== '') {
                            $db['attendance'][$period][$new_agent_id][$shift_key][$dt] = $status;
                        }
                    }
                }
            }
            
            $disable_default_repos = isset($data['disableDefaultRepos']) && $data['disableDefaultRepos'] ? true : false;
            if ($disable_default_repos && isset($db['attendance'][$period][$new_agent_id])) {
                foreach ($db['attendance'][$period][$new_agent_id] as $s_code => &$days_arr) {
                    foreach ($days_arr as $d_date => &$s_status) {
                        if ($s_status === 'R') {
                            $s_status = '1';
                        }
                    }
                }
            }

            $shiftPattern = $data['shiftPattern'] ?? null;
            $reposDay = $data['reposDay'] ?? null;
            if ($shiftPattern && is_array($shiftPattern)) {
                $cycle = (int)($shiftPattern['cycle'] ?? 1);
                $work = (int)($shiftPattern['work'] ?? 1);
                $offset = (int)($shiftPattern['offset'] ?? 0);
                $stype = $shiftPattern['shiftType'] ?? $shift_type;

                $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
                $datesList = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

                $db['attendance'][$period][$new_agent_id] = ['J' => [], 'N' => []];

                foreach ($datesList as $i => $t_str) {
                    $pos = ($i - $offset) % $cycle;
                    if ($pos < 0) $pos += $cycle;

                    $genJ = null;
                    $genN = null;

                    if ($pos < $work) {
                        if ($stype === 'Nuit')      $genN = '1';
                        elseif ($stype === 'Jour') $genJ = '1';
                        else                       { $genJ = '1'; $genN = '1'; }
                    } else {
                        if ($stype !== 'Jour' && $stype !== 'Nuit') { $genJ = 'R'; $genN = 'R'; }
                        elseif ($stype === 'Nuit')  $genN = 'R';
                        elseif ($stype === 'Jour')  $genJ = 'R';
                    }

                    if ($genJ) $db['attendance'][$period][$new_agent_id]['J'][$t_str] = $genJ;
                    if ($genN) $db['attendance'][$period][$new_agent_id]['N'][$t_str] = $genN;
                }
            } elseif ($reposDay !== null && $reposDay !== '') {
                $rDay = (int)$reposDay;
                if (isset($db['attendance'][$period][$new_agent_id])) {
                    foreach ($db['attendance'][$period][$new_agent_id] as $s_code => &$days_arr) {
                        foreach ($days_arr as $d_date => &$s_status) {
                            $dow = date('w', strtotime($d_date)); // 0 = Dimanche, 1 = Lundi
                            if ($dow == $rDay) {
                                $s_status = 'R';
                            } else {
                                if ($s_status === 'R') $s_status = '1';
                            }
                        }
                    }
                }
            }

            if (isset($db['attendance'][$period][$new_agent_id])) {
                $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
                foreach ($db['attendance'][$period][$new_agent_id] as $shift_code => $days) {
                    foreach ($days as $date => $status) {
                        $stmtAtt->execute([$new_agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
                    }
                }
            }
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true, 'agent_id' => $new_agent_id]);
        break;
    case 'delete_agent':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent invalide']);
            break;
        }
        $sqlite = getDb();
        $sqlite->prepare("DELETE FROM agents WHERE id = ?")->execute([$agent_id]);
        $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ?")->execute([$agent_id]);

        $serviceKey = resolveCurrentServiceKeySql();
        $db = getScopedData($serviceKey);
        if (isset($db['attendance']) && is_array($db['attendance'])) {
            foreach ($db['attendance'] as $period_key => $agents_data) {
                if (isset($db['attendance'][$period_key][$agent_id])) {
                    unset($db['attendance'][$period_key][$agent_id]);
                }
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;
    case 'delete_agent':
        $agent_id = $data['agent_id'] ?? '';
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent invalide']);
            break;
        }
        $sqlite = getDb();
        $sqlite->prepare("DELETE FROM agents WHERE id = ?")->execute([$agent_id]);
        $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ?")->execute([$agent_id]);

        $serviceKey = resolveCurrentServiceKeySql();
        $db = getScopedData($serviceKey);
        if (isset($db['attendance']) && is_array($db['attendance'])) {
            foreach ($db['attendance'] as $period_key => $agents_data) {
                if (isset($db['attendance'][$period_key][$agent_id])) {
                    unset($db['attendance'][$period_key][$agent_id]);
                }
            }
        }
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;
    case 'get_archived_agents':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT id, name, `function`, exit_date, exit_reason, is_blacklisted FROM agents WHERE company_id = ? AND exit_date IS NOT NULL ORDER BY exit_date DESC");
        $stmt->execute([$company_id]);
        $agents = $stmt->fetchAll();
        echo json_encode(['success' => true, 'agents' => $agents]);
        break;
    case 'update_agent_profile':
        $agent_id = $data['agent_id'] ?? '';
        $profile_data = $data['profile_data'] ?? [];
        $sqlite = getDb();
        $stmt = $sqlite->prepare("UPDATE agents SET profile_data = ? WHERE id = ?");
        $stmt->execute([json_encode($profile_data), $agent_id]);

        if (isset($data['name'])) {
            $sqlite->prepare("UPDATE agents SET name = ? WHERE id = ?")->execute([$data['name'], $agent_id]);
        }
        if (isset($data['salary'])) {
            $sqlite->prepare("UPDATE agents SET salary = ? WHERE id = ?")->execute([$data['salary'], $agent_id]);
        }

        echo json_encode(['success' => true]);
        break;
    case 'update_agent_info':
        $agent_id = $data['agent_id'] ?? 0;
        $field = $data['field'] ?? '';
        $value = $data['value'] ?? '';
        $period = $data['period'] ?? '';
        $serviceKey = $_SESSION['service_id'] ?? null;
        $sqlite = getDb();
        if (in_array($field, ['name', 'function', 'shift_type', 'has_sp', 'contract_end_date', 'status_change', 'subsite_id', 'site_id'])) {
            $val = $value;
            if ($field === 'has_sp') {
                $val = ($value === 'true' || $value === true || $value === 1 || $value === '1') ? 1 : 0;
            }
            $stmt = $sqlite->prepare("UPDATE agents SET `$field` = ? WHERE id = ?");
            $stmt->execute([$val, $agent_id]);

            if ($field === 'shift_type' && $period) {
                $db = getScopedData($serviceKey);
                $stmt = $sqlite->prepare("SELECT profile_data FROM agents WHERE id = ?");
                $stmt->execute([$agent_id]);
                $agentProfile = $stmt->fetch(PDO::FETCH_ASSOC);
                $is_admin = false;
                $is_special = false;
                $special_days = [];
                if ($agentProfile && $agentProfile['profile_data']) {
                    $profile = json_decode($agentProfile['profile_data'], true);
                    if (!empty($profile['admin_schedule'])) {
                        $is_admin = true;
                    }
                    if (!empty($profile['special_service'])) {
                        $is_special = true;
                        $special_days = $profile['special_service_days'] ?? [];
                    }
                }
                applyShiftDefaultsForPeriod($db, $agent_id, $period, $value, $is_admin, $is_special, $special_days);

                // Reset shift_history to match this new permanent shift
                $new_history = [
                    ['from' => '2000-01-01', 'type' => $value]
                ];
                $sqlite->prepare("UPDATE agents SET shift_history = ? WHERE id = ?")
                    ->execute([json_encode($new_history), $agent_id]);

                // Also apply to SQLite directly using the new array state
                if (isset($db['attendance'][$period][$agent_id])) {
                    $sqlite->prepare('DELETE FROM attendance WHERE agent_id = ? AND period = ?')->execute([$agent_id, $period]);
                    $stmtAtt = $sqlite->prepare('INSERT INTO attendance (agent_id, date, shift_code, status, company_id, service_id, period) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
                    foreach ($db['attendance'][$period][$agent_id] as $shift_code => $days) {
                        foreach ($days as $date => $status) {
                            $stmtAtt->execute([$agent_id, $date, $shift_code, $status, $company_id, $serviceKey, $period]);
                        }
                    }
                }
                saveScopedData($db, $serviceKey);
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;
    case 'get_functions':
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        // Clé partagee entre toute l'entreprise
        $company_key = 'company::' . $company_id;
        $functions = getServiceDataSql($company_key, 'functions', []);
        // Fallback: ancienne clé directe company_id si aucune donnée trouvée
        if (empty($functions)) {
            $functions = getServiceDataSql($company_id, 'functions', []);
        }
        if (empty($functions)) {
            $functions = [
                ['id' => 'AS', 'name' => 'Agent Simple'],
                ['id' => 'GA', 'name' => 'Garde Armé'],
                ['id' => 'MC', 'name' => 'Maître-Chien'],
                ['id' => 'CP', 'name' => 'Chef de Poste'],
                ['id' => 'Costume', 'name' => 'Agent en Costume']
            ];
        }

        $defaultNames = [
            'AS' => 'Agent Simple',
            'MC' => 'Maître Chien',
            'GA' => 'Garde Armé',
            'OTS' => 'Opérateur Radio',
            'CPT' => 'Chef de Poste',
            'CP' => 'Chef de Poste',
            'AC' => 'Agent Costume',
            'OPR' => 'Opérateur Radio',
            'VT' => 'Vigile',
            'RRH' => 'Responsable RH',
            'CO' => 'Chef des Opérations',
            'COA' => 'Chef des Opérations Adjoint',
            'COR' => 'Coordinateur',
            'SUP' => 'Superviseur',
            'CONTR' => 'Contrôleur',
            'TR' => 'Transporteur',
            'GB' => 'Garde du Corps',
            'Q' => 'Qualiticien',
            'CHAUFF' => 'Chauffeur',
            'SS' => 'Superviseur Sécurité',
            'RAF' => 'Responsable Administratif et Financier',
            'CPA' => 'Chef de Poste Adjoint'
        ];

        $needsSave = false;
        foreach ($functions as &$func) {
            // Si name est vide OU identique à l'id → c'est un nom cassé
            if (empty($func['name']) || $func['name'] === $func['id']) {
                $id = $func['id'];
                
                // Récupération depuis fullName ("CO - CHEF DES OPS") enregistré par l'ancien bug
                if (!empty($func['fullName']) && strpos($func['fullName'], ' - ') !== false) {
                    $parts = explode(' - ', $func['fullName'], 2);
                    if (!empty($parts[1]) && trim($parts[1]) !== $id) {
                        $func['name'] = trim($parts[1]);
                        $needsSave = true;
                    }
                }
                
                // Si toujours cassé (soit fullName absent, soit il a échoué), on applique le dictionnaire par défaut
                if (empty($func['name']) || $func['name'] === $func['id']) {
                    if (isset($defaultNames[$id])) {
                        $func['name'] = $defaultNames[$id];
                        $needsSave = true;
                    }
                }

                // On nettoie le fullName parasite
                if (isset($func['fullName'])) {
                    unset($func['fullName']);
                    $needsSave = true;
                }
            }
        }
        unset($func); // Sécurité PHP après passage par référence

        // Sauvegarder la correction en base si au moins une entrée a été corrigée
        if ($needsSave) {
            setServiceDataSql($company_key, 'functions', $functions);
            setServiceDataSql($company_id, 'functions', $functions);
        }
        // ──────────────────────────────────────────────────────────────────────────

        echo json_encode(['success' => true, 'functions' => $functions]);
        break;

    case 'save_functions':
        if (!hasPermission('fluctuation') && !hasPermission('salaries') && !hasWritePermission('company_config')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        // Stocker avec la clé commune à toute l'entreprise
        $company_key = 'company::' . $company_id;
        $funcs = $data['functions'] ?? [];
        
        // Nettoyer les champs parasites ajoutés par le frontend (fullName)
        // et dédupliquer par ID pour éviter les doublons visuels
        $cleanFuncs = [];
        $seenIds = [];
        foreach ($funcs as $fn) {
            $fnId = trim($fn['id'] ?? '');
            if ($fnId === '') continue;
            // Skip duplicates (keep first occurrence)
            $fnIdNorm = strtoupper($fnId);
            if (isset($seenIds[$fnIdNorm])) continue;
            $seenIds[$fnIdNorm] = true;
            // Strip fullName generated by frontend
            unset($fn['fullName']);
            $cleanFuncs[] = $fn;
        }
        
        // Sauvegarder sous les deux clés pour compatibilité (company:: et company_id direct)
        setServiceDataSql($company_key, 'functions', $cleanFuncs);
        setServiceDataSql($company_id, 'functions', $cleanFuncs);
        echo json_encode(['success' => true]);
        break;
    case 'archive_all_sites':
        $period = $data['period'] ?? '';
        if (!$period || !preg_match('/^\d{4}-\d{2}$/', $period)) {
            echo json_encode(['success' => false, 'message' => 'Période invalide: ' . $period]);
            break;
        }

        $sqlite = getDb();
        $serviceKey = $_SESSION['service_id'] ?? null;
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $siteOrder = $data['siteOrder'] ?? [];

        $snapshot_sites = buildSiteDataSnapshot($sqlite, $serviceKey, $period, $siteOrder);

        // Supprimer l'ancienne archive pour cette période+service (éviter les doublons et remplacer les archives vides)
        $stmtDel = $sqlite->prepare("DELETE FROM archives WHERE service_id = ? AND period = ? AND id NOT LIKE 'payroll_%'");
        $stmtDel->execute([$serviceKey, $period]);
        
        $stmtDelSnap = $sqlite->prepare("DELETE FROM payroll_snapshots WHERE company_id = ? AND period = ?");
        $stmtDelSnap->execute([$company_id, $period]);

        $archive_id = 'arch_' . time();
        $archive_data = [
            'id' => $archive_id,
            'period' => $period,
            'sites' => $snapshot_sites,
            'archived_at' => date('d/m/Y H:i'),
            'archived_by' => $_SESSION['user_name'],
            'sites_count' => count($snapshot_sites)
        ];

        $stmtArch = $sqlite->prepare('INSERT INTO archives (id, service_id, company_id, period, data) VALUES (?, ?, ?, ?, ?)');
        $stmtArch->execute([$archive_id, $serviceKey, $company_id, $period, json_encode($archive_data)]);

        $published = getServiceDataSql($company_id, 'published_periods', []);
        $published[] = $period;
        $published = array_values(array_unique($published));
        setServiceDataSql($company_id, 'published_periods', $published);

        echo json_encode(['success' => true, 'sites_count' => count($snapshot_sites)]);
        break;
    case 'get_archives':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? 'comp_default_1';
        $stmt = $sqlite->prepare("SELECT id, service_id, period, data FROM archives WHERE company_id = ? AND id NOT LIKE 'payroll_%'");
        $stmt->execute([$company_id]);
        $results = $stmt->fetchAll();

        $archives = [];
        foreach ($results as $row) {
            $data = json_decode($row['data'], true) ?? [];
            $archives[] = [
                'id' => $row['id'],
                'period' => $row['period'],
                'service_id' => $row['service_id'],
                'archived_at' => $data['archived_at'] ?? '',
                'archived_by' => $data['archived_by'] ?? '',
                'sites_count' => count($data['sites'] ?? [])
            ];
        }
        // Sort by date (newest first)
        usort($archives, function ($a, $b) {
            return strcmp($b['id'], $a['id']);
        });
        echo json_encode($archives);
        break;
    case 'get_archive_detail':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID manquant']);
            break;
        }

        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT data FROM archives WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();

        if ($result && isset($result['data'])) {
            echo $result['data'];
        } else {
            // Fallback to JSON if not found in SQLite (for older archives not yet migrated fully)
            $db = getScopedData($serviceKey);
            if (isset($db['archives'][$id])) {
                echo json_encode($db['archives'][$id]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
            }
        }
        break;
    case 'delete_archive':
        requirePermission('dashboard');
        $id = $data['id'] ?? '';
        $db = getScopedData($serviceKey);
        if (isset($db['archives'][$id])) {
            unset($db['archives'][$id]);
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Archive introuvable']);
        }
        break;
    case 'get_closure_alerts':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? '';
        $serviceKey = $_SESSION['service_id'] ?? '';
        
        $stmt = $sqlite->prepare("
            SELECT sub.id, sub.name, sub.site_id, sub.contract_end_date, sub.contract_end_updated_at, sub.closure_notified, sub.closure_last_reminder_at, s.name as site_name
            FROM subsites sub
            JOIN sites s ON sub.site_id = s.id
            WHERE sub.contract_end_date IS NOT NULL 
              AND sub.contract_end_date != ''
              AND (s.company_id = ? OR s.service_id = ?)
        ");
        $stmt->execute([$company_id, $serviceKey]);
        $subsites = $stmt->fetchAll();
        
        $period_received = $data['period'] ?? 'MISSING';
        error_log("DEBUG get_closure_alerts: period received from JS = '$period_received'");
        
        $alerts = [];
        $period = !empty($data['period']) ? $data['period'] : date('Y-m');
        $physical_now = time();
        $cycle_now = $physical_now;
        
        if (preg_match('/^(\d{4})-(\d{2})$/', $period, $matches)) {
            $pYear = (int)$matches[1];
            $pMonth = (int)$matches[2];
            // Fixer la date de référence au 20 du mois du cycle (fin du cycle)
            $cycle_now = strtotime("$pYear-$pMonth-20 23:59:59");
        }
        
        foreach ($subsites as $sub) {
            $updated_at = strtotime($sub['contract_end_updated_at'] . ' UTC');
            if (!$updated_at) continue;
            
            $closed_at = strtotime($sub['contract_end_date'] . ' 23:59:59');
            $delta_days = round(($closed_at - $updated_at) / (24 * 60 * 60));
            
            // 1. Immediate alert (after 2 minutes = 120 seconds) - Uses physical time!
            if ($sub['closure_notified'] == 0 && ($physical_now - $updated_at) >= 120) {
                // Generate agent count string
                $stmtAgents = $sqlite->prepare("SELECT `function`, shift_type, COUNT(*) as cnt FROM agents WHERE subsite_id = ? GROUP BY `function`, shift_type");
                $stmtAgents->execute([$sub['id']]);
                $counts = $stmtAgents->fetchAll();
                $count_str = [];
                $total_agents = 0;
                foreach ($counts as $c) {
                    $type = strtolower($c['shift_type']);
                    if ($type === 'j') $type = 'jour';
                    if ($type === 'n') $type = 'nuit';
                    $func = trim($c['function']);
                    $func_str = empty($func) ? "" : "($func) ";
                    $lbl = $c['cnt'] > 1 ? 'agents' : 'agent';
                    $count_str[] = str_pad($c['cnt'], 2, '0', STR_PAD_LEFT) . " $lbl $func_str$type";
                    $total_agents += $c['cnt'];
                }
                $details = empty($count_str) ? 'aucun agent fixe' : implode(', ', $count_str);
                
                $message = "Vous venez de programmer la fermeture du site {$sub['site_name']} - {$sub['name']} pour le " . date('d/m/Y', $closed_at) . ". Après la fermeture, nous allons perdre $total_agents agent(s) dont : $details. Assurez-vous d'avoir réaffecté ces agents avant la date butoir.";
                
                $alerts[] = [
                    'id' => $sub['id'] . '_immediate',
                    'subsite_id' => $sub['id'],
                    'type' => 'immediate',
                    'message' => $message
                ];
                continue; // Do not show reminder if immediate is not yet acknowledged
            }
            
            // 2. Reminders - Uses cycle_now!
            $pYear = $pYear ?? (int)date('Y');
            $pMonth = $pMonth ?? (int)date('m');
            $is_this_cycle = ($pYear == date('Y', $closed_at) && $pMonth == date('m', $closed_at));
            
            if ($cycle_now < $closed_at || $is_this_cycle) { 
                $days_to_close = round(($closed_at - $cycle_now) / (24 * 60 * 60));
                
                $last_reminder_at = $sub['closure_last_reminder_at'] ? strtotime($sub['closure_last_reminder_at']) : null;
                $should_remind = false;
                
                if ($is_this_cycle) {
                    // Si on est dans le mois de fermeture, rappel tous les jours (24h)
                    if (!$last_reminder_at || ($physical_now - $last_reminder_at) >= 24 * 60 * 60) {
                        $should_remind = true;
                    }
                } else if ($delta_days >= 14) {
                    // Wait 7 days after creation for the first reminder
                    if ($physical_now >= ($updated_at + 7 * 24 * 60 * 60)) {
                        if (!$last_reminder_at) {
                            $should_remind = true;
                        } else if (($physical_now - $last_reminder_at) >= 3 * 24 * 60 * 60) {
                            $should_remind = true;
                        }
                    }
                } else {
                    // Less than 14 days: wait about half the time, show ONCE
                    $wait_days = max(1, floor($delta_days / 2));
                    if (!$last_reminder_at && $physical_now >= ($updated_at + $wait_days * 24 * 60 * 60)) {
                        $should_remind = true;
                    }
                }
                
                if ($should_remind) {
                    $time_msg = $is_this_cycle ? "a lieu durant ce mois de pointage !" : "arrive dans $days_to_close jour(s).";
                    $message = "La fermeture du site {$sub['site_name']} - {$sub['name']} programmée le " . date('d/m/Y', $updated_at) . " et prévue pour le " . date('d/m/Y', $closed_at) . " $time_msg Veuillez redéployer les agents sur leur nouveau poste si ce n'est pas déjà fait.";
                    $alerts[] = [
                        'id' => $sub['id'] . '_reminder',
                        'subsite_id' => $sub['id'],
                        'type' => 'reminder',
                        'message' => $message
                    ];
                }
            }
        }
        
        echo json_encode(['success' => true, 'alerts' => $alerts]);
        break;
    case 'ack_closure_alert':
        $subsite_id = $data['subsite_id'] ?? '';
        $type = $data['type'] ?? '';
        $sqlite = getDb();
        if ($type === 'immediate') {
            $stmt = $sqlite->prepare("UPDATE subsites SET closure_notified = 1 WHERE id = ?");
            $stmt->execute([$subsite_id]);
        } else if ($type === 'reminder') {
            $stmt = $sqlite->prepare("UPDATE subsites SET closure_last_reminder_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$subsite_id]);
        }
        echo json_encode(['success' => true]);
        break;
    case 'clear_site_mutations':
        $site_id = (string) ($data['site_id'] ?? '');
        $period = $data['period'] ?? '';

        if (!$site_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
            break;
        }

        $db = getScopedData($serviceKey);
        $target_site = null;
        foreach ($db['sites'] as $s) {
            if ((string) $s['id'] === $site_id) {
                $target_site = $s;
                break;
            }
        }

        if (!$target_site) {
            echo json_encode(['success' => false, 'message' => 'Site introuvable']);
            break;
        }

        // Collect all agent IDs for this site
        $agent_ids = [];
        if (isset($target_site['subsites'])) {
            foreach ($target_site['subsites'] as $sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as $agent) {
                        $agent_ids[] = $agent['id'];
                    }
                }
            }
        }

        if (isset($db['attendance'][$period])) {
            foreach ($agent_ids as $aid) {
                if (isset($db['attendance'][$period][$aid])) {
                    foreach (['J', 'N', 'S'] as $sc) {
                        if (isset($db['attendance'][$period][$aid][$sc])) {
                            foreach ($db['attendance'][$period][$aid][$sc] as $date => $status) {
                                if (is_string($status) && strpos($status, 'M|') === 0) {
                                    unset($db['attendance'][$period][$aid][$sc][$date]);
                                }
                            }
                        }
                    }
                }
            }
        }

        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);
        break;
    case 'update_agent_salary':
        if ($_SESSION['user_role'] != 'admin') {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $agent_id = $data['agent_id'] ?? '';
        $salary = (int) ($data['salary'] ?? 0);

        $sqlite = getDb();
        $sqlite->prepare("UPDATE agents SET salary = ? WHERE id = ?")->execute([$salary, $agent_id]);

        $db = getScopedData($serviceKey);
        $found = false;
        foreach ($db['sites'] as &$site) {
            if (!isset($site['subsites']))
                continue;
            foreach ($site['subsites'] as &$sub) {
                if (isset($sub['agents'])) {
                    foreach ($sub['agents'] as &$agent) {
                        if ($agent['id'] == $agent_id) {
                            $agent['salary'] = $salary;
                            $found = true;
                            break 3;
                        }
                    }
                }
            }
        }
        if ($found) {
            saveScopedData($db, $serviceKey);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Agent introuvable']);
        }
        break;

    case 'get_agent_schedules':
        $agent_id = $_GET['agent_id'] ?? ($data['agent_id'] ?? '');
        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent manquant']);
            break;
        }
        $sqlite = getDb();
        $stmt = $sqlite->prepare("SELECT day_of_week, target_site_id, target_subsite_id FROM agent_schedules WHERE agent_id = ?");
        $stmt->execute([$agent_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    case 'update_agent_schedules':
        $agent_id = $data['agent_id'] ?? '';
        $period = $data['period'] ?? date('m/Y');
        $schedule = $data['schedule'] ?? [];
        $keeps = $data['keeps'] ?? [];
        $force_apply = $data['force_apply'] ?? false;

        if (!$agent_id) {
            echo json_encode(['success' => false, 'message' => 'Agent manquant']);
            break;
        }

        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }
        $company_id = $_SESSION['company_id'] ?? null;

        $sqlite = getDb();
        $db = getScopedData($serviceKey);
        
        // Save the schedule template in the database
        $sqlite->prepare("DELETE FROM agent_schedules WHERE agent_id = ?")->execute([$agent_id]);
        $stmtSched = $sqlite->prepare("INSERT INTO agent_schedules (agent_id, day_of_week, target_site_id, target_subsite_id) VALUES (?, ?, ?, ?)");
        foreach ($schedule as $day => $target) {
            if (!empty($target['site_id'])) {
                $stmtSched->execute([$agent_id, $day, $target['site_id'], $target['subsite_id'] ?? null]);
            }
        }

        // Map JS days (1-7) to dates in the period
        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $datesList = getPeriodDates($period, (int)($settingsRow['cycle_start'] ?? 21), (int)($settingsRow['cycle_end'] ?? 20));

        $dates_by_day = []; // day_of_week (1-7) => array of dates (YYYY-MM-DD)
        for ($d = 1; $d <= 7; $d++) {
            $dates_by_day[$d] = [];
        }
        foreach ($datesList as $dateStr) {
            $dow = date('N', strtotime($dateStr)); // 1=Mon, 7=Sun
            $dates_by_day[$dow][] = $dateStr;
        }
        
        // Calculate expected statuses based on schedule
        $all_sites = $sqlite->query("SELECT id, name FROM sites");
        $site_name_map = [];
        foreach ($all_sites as $s) {
            $site_name_map[$s['id']] = $s['name'];
        }

        $expected_status_by_date = [];
        $expected_site_name_by_date = [];
        foreach ($schedule as $day => $target) {
            $site_id = $target['site_id'];
            $site_name = $site_name_map[$site_id] ?? '';
            if ($site_name && isset($dates_by_day[$day])) {
                foreach ($dates_by_day[$day] as $dt) {
                    $subsite_id = $target['subsite_id'] ?? '';
                    $expected_status_by_date[$dt] = "REL_1|{$site_name}|{$site_id}|{$subsite_id}|";
                    $expected_site_name_by_date[$dt] = $site_name;
                }
            }
        }
        
        foreach ($datesList as $dt) {
            if (!isset($expected_status_by_date[$dt])) {
                $expected_status_by_date[$dt] = '';
                $expected_site_name_by_date[$dt] = 'Aucun/Repos';
            }
        }
        file_put_contents(__DIR__ . '/debug_schedule.txt', json_encode([
            'schedule' => $schedule,
            'dates_by_day' => $dates_by_day,
            'expected_status_by_date' => $expected_status_by_date
        ]));

        // Check conflicts if not forced (only for existing REL_1| pointings)
        if (!$force_apply) {
            $stmtAtt = $sqlite->prepare("SELECT date, status FROM attendance WHERE agent_id = ? AND period = ? AND shift_code IN ('J','N') AND status LIKE 'REL_1|%'");
            $stmtAtt->execute([$agent_id, $period]);
            $existing_att = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            $conflicts = [];
            foreach ($existing_att as $row) {
                $dt = $row['date'];
                $curr_status = $row['status'];
                $exp_status = $expected_status_by_date[$dt] ?? '';
                
                if ($curr_status !== $exp_status) {
                    $curr_parts = explode('|', $curr_status);
                    $curr_site = $curr_parts[1] ?? 'Inconnu';
                    
                    $conflicts[] = [
                        'date' => $dt,
                        'date_formatted' => date('d/m/Y', strtotime($dt)),
                        'current_status' => "Déployé sur " . $curr_site,
                        'new_status' => $exp_status ? "Déployé sur " . $expected_site_name_by_date[$dt] : "Repos/Aucun"
                    ];
                }
            }

            if (count($conflicts) > 0) {
                echo json_encode(['success' => true, 'has_conflicts' => true, 'conflicts' => $conflicts]);
                break;
            }
        }

        // Save schedule to DB
        $sqlite->beginTransaction();
        try {
            $stmtDel = $sqlite->prepare("DELETE FROM agent_schedules WHERE agent_id = ?");
            $stmtDel->execute([$agent_id]);

            $stmtIns = $sqlite->prepare("INSERT INTO agent_schedules (agent_id, day_of_week, target_site_id, target_subsite_id) VALUES (?, ?, ?, ?)");
            foreach ($schedule as $day => $target) {
                if (!empty($target['site_id'])) {
                    $stmtIns->execute([$agent_id, $day, $target['site_id'], $target['subsite_id'] ?? null]);
                }
            }

            // Purely visual scheduling via agent_schedules. No attendance updates for REL_1|.

            // Revert any existing REL_1| in attendance to clean up the DB from old logic
        $stmtGetAtt = $sqlite->prepare("SELECT date, status, shift_code FROM attendance WHERE agent_id = ? AND period = ?");
        $stmtGetAtt->execute([$agent_id, $period]);
        $all_att = $stmtGetAtt->fetchAll(PDO::FETCH_ASSOC);

        $stmtUpdate = $sqlite->prepare("UPDATE attendance SET status = ? WHERE agent_id = ? AND date = ? AND shift_code = ? AND period = ?");

        foreach ($all_att as $row) {
            $curr_status = $row['status'];
            if (strpos($curr_status, 'REL_1|') === 0) {
                $parts = explode('|', $curr_status);
                $revertStatus = isset($parts[4]) && $parts[4] !== '' ? $parts[4] : '1';
                $stmtUpdate->execute([$revertStatus, $agent_id, $row['date'], $row['shift_code'], $period]);
                
                if (!isset($db['attendance'][$period])) $db['attendance'][$period] = [];
                if (!isset($db['attendance'][$period][$agent_id])) $db['attendance'][$period][$agent_id] = [];
                if (!isset($db['attendance'][$period][$agent_id][$row['shift_code']])) $db['attendance'][$period][$agent_id][$row['shift_code']] = [];
                $db['attendance'][$period][$agent_id][$row['shift_code']][$row['date']] = $revertStatus;
            }
        }

        $sqlite->commit();
        saveScopedData($db, $serviceKey);
        echo json_encode(['success' => true]);

        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'clear_agent_site_mutations':
        $site_name = $data['site_name'] ?? '';
        $agent_id = $data['agent_id'] ?? '';
        $period = $data['period'] ?? '';

        if (!$site_name || !$agent_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
            break;
        }

        $sqlite = getDb();
        $like = '%|' . $site_name;
        
        $stmt = $sqlite->prepare("SELECT id, status FROM attendance WHERE agent_id = ? AND period = ? AND status LIKE ?");
        $stmt->execute([$agent_id, $period, $like]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $deleteStmt = $sqlite->prepare("DELETE FROM attendance WHERE id = ?");
        $updateStmt = $sqlite->prepare("UPDATE attendance SET status = ? WHERE id = ?");

        foreach ($rows as $row) {
            $parts = explode('|', $row['status']);
            $prefix = $parts[0];
            
            $new_status = '';
            if (strpos($prefix, 'REL_') === 0) {
                $new_status = substr($prefix, 4); // Extract what is after REL_ (e.g., 1, R, A)
            } elseif (strpos($prefix, 'EXT_') === 0) {
                $new_status = substr($prefix, 4);
            } elseif (strpos($prefix, 'M_') === 0) {
                $new_status = substr($prefix, 2);
            } elseif ($prefix === 'REL' || $prefix === 'EXT' || $prefix === 'M') {
                $new_status = '';
            } else {
                $new_status = '';
            }
            
            if ($new_status === '') {
                $deleteStmt->execute([$row['id']]);
            } else {
                $updateStmt->execute([$new_status, $row['id']]);
            }
        }

        echo json_encode(['success' => true]);
        break;

    case 'delete_agent_mutations':
        $site_name = $data['site_name'] ?? '';
        $destination_site_id = $data['destination_site_id'] ?? '';
        $agent_id = $data['agent_id'] ?? '';
        $period = $data['period'] ?? '';

        if (!$site_name || !$agent_id || !$period) {
            echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
            break;
        }

        $sqlite = getDb();

        try {
            $sqlite->beginTransaction();
            
            // 1. Clean up attendance on DESTINATION side
            $like = '%|' . $site_name;
            $stmt = $sqlite->prepare("SELECT id, status FROM attendance WHERE agent_id = ? AND period = ? AND status LIKE ?");
            $stmt->execute([$agent_id, $period, $like]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $deleteStmt = $sqlite->prepare("DELETE FROM attendance WHERE id = ?");
            $updateStmt = $sqlite->prepare("UPDATE attendance SET status = ? WHERE id = ?");

            foreach ($rows as $row) {
                $parts = explode('|', $row['status']);
                $prefix = $parts[0];
                
                $new_status = '';
                if (strpos($prefix, 'REL_') === 0) {
                    $new_status = substr($prefix, 4);
                } elseif (strpos($prefix, 'EXT_') === 0) {
                    $new_status = substr($prefix, 4);
                } elseif (strpos($prefix, 'M_') === 0) {
                    $new_status = substr($prefix, 2);
                }
                
                if ($new_status === '') {
                    $deleteStmt->execute([$row['id']]);
                } else {
                    $updateStmt->execute([$new_status, $row['id']]);
                }
            }

            // 2. Clean up ORIGIN side
            if ($destination_site_id) {
                $subsiteStmt = $sqlite->prepare("SELECT id FROM subsites WHERE site_id = ?");
                $subsiteStmt->execute([$destination_site_id]);
                $subsites = $subsiteStmt->fetchAll();
                
                $all_dest_ids = [$destination_site_id, 'default_' . $destination_site_id, 'site_extras_sur_site'];
                foreach ($subsites as $s) {
                    $all_dest_ids[] = $s['id'];
                }

                foreach ($all_dest_ids as $did) {
                    $sqlite->prepare("DELETE FROM attendance WHERE agent_id = ? AND period = ? AND status LIKE ?")
                           ->execute([$agent_id, $period, "Suppl|" . $did . "%"]);
                    
                    $sqlite->prepare("DELETE FROM supplementaires_externes WHERE agent_id = ? AND site_destination_id = ? AND periode = ?")
                           ->execute([$agent_id, $did, $period]);
                }
            }

            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $sqlite->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;

    case 'get_lost_sites':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? null;
        $serviceKey = $_SESSION['service_id'] ?? null;
        if (!$serviceKey && function_exists('resolveCurrentServiceKeySql')) {
            $serviceKey = resolveCurrentServiceKeySql();
        }

        // Récupérer les sous-sites avec contract_end_date IS NOT NULL
        // On récupère aussi le nom du site parent pour plus de contexte
        $stmt = $sqlite->prepare("
            SELECT sub.id, sub.name, sub.site_id, sub.contract_end_date, sub.contract_end_motif, s.name as site_name
            FROM subsites sub
            JOIN sites s ON sub.site_id = s.id
            WHERE sub.contract_end_date IS NOT NULL 
              AND sub.contract_end_date != ''
              AND (s.company_id = ? OR s.service_id = ?)
            ORDER BY sub.contract_end_date DESC
        ");
        $stmt->execute([$company_id, $serviceKey]);
        $lost_sites = $stmt->fetchAll();

        // Count titular agents per function and shift_type for each lost subsite
        $stmtAgents = $sqlite->prepare("SELECT `function`, shift_type, COUNT(*) as cnt FROM agents WHERE subsite_id = ? GROUP BY `function`, shift_type");
        foreach ($lost_sites as &$ls) {
            $stmtAgents->execute([$ls['id']]);
            $counts = $stmtAgents->fetchAll();
            $count_str = [];
            foreach ($counts as $c) {
                $type = $c['shift_type'];
                if ($type === 'J') $type = 'jour';
                if ($type === 'N') $type = 'nuit';
                if ($type === 'Jour') $type = 'jour';
                if ($type === 'Nuit') $type = 'nuit';
                
                $func = trim($c['function']);
                if (empty($func)) {
                    $func_str = "";
                } else {
                    $func_str = "($func) ";
                }
                
                $lbl = $c['cnt'] > 1 ? 'agents' : 'agent';
                $count_str[] = str_pad($c['cnt'], 2, '0', STR_PAD_LEFT) . " $lbl $func_str$type";
            }
            $ls['lost_agents_summary'] = $count_str; // array
        }



        echo json_encode(['success' => true, 'lost_sites' => $lost_sites, 'sites' => $lost_sites]);
        break;

    case 'move_agent_zone':
        $sqlite = getDb();
        $agent_id = $data['agent_id'] ?? '';
        $new_subsite_id = $data['new_subsite_id'] ?? '';

        if (empty($agent_id) || empty($new_subsite_id)) {
            echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
            exit;
        }

        try {
            $sqlite->beginTransaction();
            
            // Mettre à jour l'agent
            $stmt = $sqlite->prepare("UPDATE agents SET subsite_id = ? WHERE id = ?");
            $stmt->execute([$new_subsite_id, $agent_id]);

            $sqlite->commit();
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            if ($sqlite->inTransaction()) {
                $sqlite->rollBack();
            }
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;

    case 'verify_period_lock':
        $sqlite = getDb();
        $company_id = $_SESSION['company_id'] ?? null;
        $period = $_POST['period'] ?? null;
        $password = $_POST['password'] ?? null;

        if (!$company_id || !$period || !$password) {
            echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
            exit;
        }

        $stmt = $sqlite->prepare("SELECT password_hash FROM period_passwords WHERE company_id = ? AND period = ?");
        $stmt->execute([$company_id, $period]);
        $lock = $stmt->fetch();

        if ($lock && password_verify($password, $lock['password_hash'])) {
            $_SESSION['unlocked_periods'][$company_id][$period] = true;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Mot de passe incorrect']);
        }
        break;

    case 'toggle_period_lock':
        $sqlite = getDb();
        
        $sqlite->exec("CREATE TABLE IF NOT EXISTS period_passwords (
            company_id VARCHAR(100),
            period VARCHAR(20),
            password_hash TEXT,
            locked_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(company_id, period)
        )");
        try { $sqlite->exec("ALTER TABLE period_passwords ADD COLUMN locked_by TEXT"); } catch (Exception $e) {}

        $company_id = $_SESSION['company_id'] ?? null;
        $period = $_POST['period'] ?? null;
        $action_type = $_POST['action_type'] ?? 'lock';
        $password = $_POST['password'] ?? null;
        $user_id = $_SESSION['user_id'] ?? 'unknown';

        if (!$company_id || !$period) {
            echo json_encode(['success' => false, 'error' => 'Paramètres manquants']);
            exit;
        }

        if ($action_type === 'unlock') {
            $stmt = $sqlite->prepare("DELETE FROM period_passwords WHERE company_id = ? AND period = ?");
            $stmt->execute([$company_id, $period]);
            echo json_encode(['success' => true, 'message' => 'Mois déverrouillé avec succès.']);
        } else {
            if (!$password) {
                echo json_encode(['success' => false, 'error' => 'Mot de passe requis pour verrouiller.']);
                exit;
            }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $sqlite->prepare("INSERT OR REPLACE INTO period_passwords (company_id, period, password_hash, locked_by) VALUES (?, ?, ?, ?)");
            $stmt->execute([$company_id, $period, $hash, $user_id]);
            $_SESSION['unlocked_periods'][$company_id][$period] = true;
            echo json_encode(['success' => true, 'message' => 'Mois verrouillé avec succès.']);
        }
        break;

    case 'toggle_permanent_supplement':
        $sqlite = getDb();
        $agent_id = $_POST['agent_id'] ?? null;
        $days = isset($_POST['days']) ? $_POST['days'] : [];
        if (!is_array($days)) {
            $days = [];
        }
        
        if (!$agent_id) {
            echo json_encode(['success' => false, 'error' => 'Agent ID manquant']);
            exit;
        }
        
        $stmt = $sqlite->prepare("SELECT profile_data FROM agents WHERE id = ?");
        $stmt->execute([$agent_id]);
        $agent = $stmt->fetch();
        
        if ($agent) {
            $profile = json_decode($agent['profile_data'], true) ?: [];
            $profile['permanent_supps'] = array_map('intval', $days);
            $stmtUpd = $sqlite->prepare("UPDATE agents SET profile_data = ? WHERE id = ?");
            $stmtUpd->execute([json_encode($profile), $agent_id]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Agent introuvable']);
        }
        break;
}
