<?php
/**
 * migrate.php — Migration JSON → SQLite pour ELYSIUM
 * 
 * Usage : php migrate.php
 * Ce script lit pointage_db.json et insère toutes les données dans elysium.db
 * Il est idempotent : peut être relancé sans dupliquer les données.
 */

// Sécurité : exécution CLI uniquement
if (php_sapi_name() !== 'cli') {
    // Permettre aussi via navigateur avec token de sécurité
    $token = $_GET['token'] ?? '';
    $expectedToken = md5('ELYSIUM_MIGRATE_' . date('Y-m-d'));
    if ($token !== $expectedToken) {
        http_response_code(403);
        die(json_encode(['error' => 'Accès refusé. Token requis: ?token=' . $expectedToken]));
    }
}

set_time_limit(300);
ini_set('memory_limit', '256M');

require_once __DIR__ . '/database.php';

$isCli = php_sapi_name() === 'cli';
$jsonFile = __DIR__ . '/../pointage_db.json';

function log_msg(string $msg): void
{
    global $isCli;
    if ($isCli) {
        echo $msg . PHP_EOL;
    } else {
        echo $msg . "<br>\n";
        ob_flush();
        flush();
    }
}

if (!file_exists($jsonFile)) {
    die("ERREUR: pointage_db.json introuvable à : $jsonFile\n");
}

log_msg("=== ELYSIUM — Migration JSON → SQLite ===");
log_msg("Lecture de pointage_db.json...");

$raw = file_get_contents($jsonFile);
$data = json_decode($raw, true);
if (!is_array($data)) {
    die("ERREUR: JSON invalide ou corrompu.\n");
}

$db = getDb();
log_msg("Base SQLite initialisée : " . SQLITE_FILE);

$stats = ['users' => 0, 'services' => 0, 'agents' => 0, 'attendance' => 0, 'messages' => 0, 'entreprises' => 0];

// ─── 1. Entreprises ───────────────────────────────────────────────────────────
log_msg("\n[1/8] Migration des entreprises...");

$companyIds = [];

// Collecter tous les company_id uniques depuis les users
$users = $data['users'] ?? [];
foreach ($users as $email => $user) {
    $cid = $user['company_id'] ?? 'comp_default_1';
    if (!isset($companyIds[$cid])) {
        $companyIds[$cid] = 'Entreprise ' . $cid;
    }
}
// Depuis les services
foreach ($data['services'] ?? [] as $svc) {
    $cid = $svc['company_id'] ?? 'comp_default_1';
    if (!isset($companyIds[$cid])) {
        $companyIds[$cid] = 'Entreprise ' . $cid;
    }
}
// Depuis les sites
foreach ($data['sites'] ?? [] as $site) {
    $cid = $site['company_id'] ?? 'comp_default_1';
    if (!isset($companyIds[$cid])) {
        $companyIds[$cid] = 'Entreprise ' . $cid;
    }
}

$stmtEnt = $db->prepare(
    'INSERT OR IGNORE INTO entreprises (id, name) VALUES (?, ?)'
);
foreach ($companyIds as $cid => $cname) {
    $stmtEnt->execute([$cid, $cname]);
    $stats['entreprises']++;
}
log_msg("  → {$stats['entreprises']} entreprises migrées.");

// ─── 2. Utilisateurs ──────────────────────────────────────────────────────────
log_msg("\n[2/8] Migration des utilisateurs...");

$stmtUser = $db->prepare('
    INSERT OR REPLACE INTO users
        (email, password, name, role, role_display_name, service, service_id,
         company_id, permissions, trial_started_at, trial_ends_at,
         subscription_until, subscription_plan, subscription_price,
         subscription_currency, last_activity, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
');

foreach ($users as $email => $u) {
    $perms = is_array($u['permissions'] ?? null) ? json_encode($u['permissions']) : '{}';
    $stmtUser->execute([
        strtolower($email),
        $u['password'] ?? '',
        $u['name'] ?? '',
        $u['role'] ?? 'user',
        $u['role_display_name'] ?? '',
        $u['service'] ?? '',
        $u['service_id'] ?? '',
        $u['company_id'] ?? 'comp_default_1',
        $perms,
        $u['trial_started_at'] ?? null,
        $u['trial_ends_at'] ?? null,
        $u['subscription_until'] ?? null,
        $u['subscription_plan'] ?? 'premium_monthly',
        (int)($u['subscription_price'] ?? 20000),
        $u['subscription_currency'] ?? 'XOF',
        $u['last_activity'] ?? null,
        $u['created_at'] ?? date('Y-m-d H:i:s'),
    ]);
    $stats['users']++;
}
log_msg("  → {$stats['users']} utilisateurs migrés.");

// ─── 3. Services ──────────────────────────────────────────────────────────────
log_msg("\n[3/8] Migration des services...");

$stmtSvc = $db->prepare('
    INSERT OR IGNORE INTO services (id, name, company_id, permissions)
    VALUES (?, ?, ?, ?)
');
foreach ($data['services'] ?? [] as $svc) {
    $perms = is_array($svc['permissions'] ?? null) ? json_encode($svc['permissions']) : '{}';
    $stmtSvc->execute([
        $svc['id'],
        $svc['name'],
        $svc['company_id'] ?? 'comp_default_1',
        $perms,
    ]);
    $stats['services']++;
}
log_msg("  → {$stats['services']} services migrés.");

// ─── 4. Sites, Subsites, Agents (données globales) ───────────────────────────
log_msg("\n[4/8] Migration des sites/agents globaux...");

$stmtSite = $db->prepare('INSERT OR IGNORE INTO sites (id, name, company_id) VALUES (?, ?, ?)');
$stmtSub  = $db->prepare('INSERT OR IGNORE INTO subsites (id, name, site_id) VALUES (?, ?, ?)');
$stmtAgt  = $db->prepare('
    INSERT OR IGNORE INTO agents
        (id, name, function, shift_type, has_sp, hire_date, recruitment_cost, subsite_id, company_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
');

foreach ($data['sites'] ?? [] as $site) {
    $stmtSite->execute([$site['id'], $site['name'], $site['company_id'] ?? 'comp_default_1']);
    foreach ($site['subsites'] ?? [] as $sub) {
        $stmtSub->execute([$sub['id'], $sub['name'], $site['id']]);
        foreach ($sub['agents'] ?? [] as $agt) {
            $stmtAgt->execute([
                $agt['id'], $agt['name'],
                $agt['function'] ?? 'AS',
                $agt['shift_type'] ?? 'Jour',
                (int)($agt['has_sp'] ?? 0),
                $agt['hire_date'] ?? null,
                (int)($agt['recruitment_cost'] ?? 0),
                $sub['id'],
                $site['company_id'] ?? 'comp_default_1',
            ]);
            $stats['agents']++;
        }
    }
}
log_msg("  → {$stats['agents']} agents globaux migrés.");

// ─── 5. Présences globales ────────────────────────────────────────────────────
log_msg("\n[5/8] Migration des présences globales...");

$stmtAtt = $db->prepare('
    INSERT OR IGNORE INTO attendance (agent_id, date, shift_code, status, company_id, period)
    VALUES (?, ?, ?, ?, ?, ?)
');

foreach ($data['attendance'] ?? [] as $period => $agents) {
    foreach ($agents as $agentId => $shifts) {
        foreach ($shifts as $shiftCode => $dates) {
            if (!is_array($dates)) continue;
            foreach ($dates as $date => $status) {
                $stmtAtt->execute([$agentId, $date, $shiftCode, $status, 'comp_default_1', $period]);
                $stats['attendance']++;
            }
        }
    }
}
log_msg("  → {$stats['attendance']} enregistrements de présence migrés.");

// ─── 6. Données par service (service_data) ────────────────────────────────────
log_msg("\n[6/8] Migration des données par service...");

$agentsCount = 0;
$attCount    = 0;

foreach ($data['service_data'] ?? [] as $svcId => $svcData) {
    $companySvc = null;
    // Retrouver le company_id du service
    foreach ($data['services'] ?? [] as $s) {
        if ($s['id'] === $svcId) {
            $companySvc = $s['company_id'] ?? 'comp_default_1';
            break;
        }
    }
    if (!$companySvc) $companySvc = 'comp_default_1';

    // Sites du service
    foreach ($svcData['sites'] ?? [] as $site) {
        $stmtSite->execute([$site['id'], $site['name'], $companySvc]);
        foreach ($site['subsites'] ?? [] as $sub) {
            $stmtSub->execute([$sub['id'], $sub['name'], $site['id']]);
            foreach ($sub['agents'] ?? [] as $agt) {
                $db->prepare('
                    INSERT OR IGNORE INTO agents
                        (id, name, function, shift_type, has_sp, hire_date, recruitment_cost, subsite_id, service_id, company_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ')->execute([
                    $agt['id'], $agt['name'],
                    $agt['function'] ?? 'AS',
                    $agt['shift_type'] ?? 'Jour',
                    (int)($agt['has_sp'] ?? 0),
                    $agt['hire_date'] ?? null,
                    (int)($agt['recruitment_cost'] ?? 0),
                    $sub['id'], $svcId, $companySvc,
                ]);
                $agentsCount++;
            }
        }
    }

    // Présences du service
    foreach ($svcData['attendance'] ?? [] as $period => $agents) {
        foreach ($agents as $agentId => $shifts) {
            foreach ($shifts as $shiftCode => $dates) {
                if (!is_array($dates)) continue;
                foreach ($dates as $date => $status) {
                    $stmtAtt->execute([$agentId, $date, $shiftCode, $status, $companySvc, $period]);
                    $stmtAtt->execute([$agentId, $date, $shiftCode, $status, $companySvc, $period]);
                    // Note: INSERT OR IGNORE évite les doublons
                    $attCount++;
                }
            }
        }
    }

    // Messages du service
    $stmtMsg = $db->prepare('
        INSERT OR IGNORE INTO messages (ticket_id, sender, content, service_id, company_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    foreach ($svcData['messages'] ?? [] as $msg) {
        $stmtMsg->execute([
            $msg['ticket_id'] ?? null,
            $msg['sender'] ?? $msg['from'] ?? 'system',
            $msg['content'] ?? $msg['message'] ?? '',
            $svcId, $companySvc,
            $msg['created_at'] ?? $msg['timestamp'] ?? date('Y-m-d H:i:s'),
        ]);
        $stats['messages']++;
    }

    // Archives du service
    if (!empty($svcData['archives'])) {
        $stmtArch = $db->prepare('
            INSERT OR IGNORE INTO archives (id, service_id, company_id, period, data)
            VALUES (?, ?, ?, ?, ?)
        ');
        foreach ($svcData['archives'] as $archId => $arch) {
            if (is_array($arch)) {
                $stmtArch->execute([
                    $arch['id'] ?? $archId,
                    $svcId, $companySvc,
                    $arch['period'] ?? '',
                    json_encode($arch),
                ]);
            }
        }
    }
}

log_msg("  → $agentsCount agents de services migrés.");
log_msg("  → $attCount présences de services migrées.");
log_msg("  → {$stats['messages']} messages migrés.");

// ─── 7. Payments ──────────────────────────────────────────────────────────────
log_msg("\n[7/8] Migration des paiements...");

$stmtPay = $db->prepare('
    INSERT OR IGNORE INTO payments (id, user_email, amount, currency, provider, status, company_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
');
$payCount = 0;
foreach ($data['payments'] ?? [] as $pay) {
    $stmtPay->execute([
        $pay['id'] ?? uniqid('pay_'),
        $pay['email'] ?? $pay['user_email'] ?? '',
        (int)($pay['amount'] ?? 0),
        $pay['currency'] ?? 'XOF',
        $pay['provider'] ?? '',
        $pay['status'] ?? 'pending',
        $pay['company_id'] ?? 'comp_default_1',
        $pay['created_at'] ?? date('Y-m-d H:i:s'),
    ]);
    $payCount++;
}
log_msg("  → $payCount paiements migrés.");

// ─── 8. Résumé final ─────────────────────────────────────────────────────────
log_msg("\n=== Migration terminée avec succès ! ===");
log_msg("  Entreprises : {$stats['entreprises']}");
log_msg("  Utilisateurs: {$stats['users']}");
log_msg("  Services    : {$stats['services']}");
log_msg("  Agents      : " . ($stats['agents'] + $agentsCount));
log_msg("  Présences   : " . ($stats['attendance'] + $attCount));
log_msg("  Messages    : {$stats['messages']}");
log_msg("  Paiements   : $payCount");
log_msg("\nBase de données : " . SQLITE_FILE);
log_msg("Taille          : " . round(filesize(SQLITE_FILE) / 1024, 2) . " Ko");

if (!$isCli) {
    echo json_encode(['success' => true, 'stats' => array_merge($stats, ['db_size_kb' => round(filesize(SQLITE_FILE) / 1024, 2)])]);
}
