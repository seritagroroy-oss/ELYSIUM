<?php
$file = 'c:\laragon\www\pontage\backend\modules\pointage.php';
$content = file_get_contents($file);

$startMarker = "        // Nombre total de jours potentiels travaillés";
$endMarker = "    case 'get_archives_pointage_list':";

$posStart = strpos($content, $startMarker);
$posEnd = strpos($content, $endMarker);

if ($posStart !== false && $posEnd !== false) {
    $goodContent = <<<EOT
        // Nombre total de jours potentiels travaillés
        \$totalPossibleDays = \$totalAgents * count(\$dates);
        \$presenceRate = \$totalPossibleDays > 0 ? round((1 - (\$totalAbsences / \$totalPossibleDays)) * 100, 1) : 0;
        \$totalPresences = \$totalPossibleDays - \$totalAbsences;

        \$monthlyAttendance = [];
        for (\$w = 0; \$w < 4; \$w++) {
            \$monthlyAttendance[] = [
                'name' => 'Semaine ' . (\$w + 1),
                'Présents' => \$weekData[\$w]['Présents'],
                'Absents' => \$weekData[\$w]['Absents']
            ];
        }

        // 2. Agents par site (pour le camembert)
        \$agentsBySiteCounts = [];
        foreach (\$allAgents as \$agent) {
            \$siteId = \$agent['site_id'] ?? null;
            if (!\$siteId) {
                \$subId = \$agent['subsite_id'] ?? '';
                if (strpos(\$subId, 'site_extras') !== false) \$siteId = 'site_extras';
                elseif (strpos(\$subId, 'site_releves') !== false) \$siteId = 'site_releves';
                elseif (strpos(\$subId, 'site_admin') !== false) \$siteId = 'site_administration';
                else \$siteId = 'Inconnu';
            }
            if (!isset(\$agentsBySiteCounts[\$siteId])) \$agentsBySiteCounts[\$siteId] = 0;
            \$agentsBySiteCounts[\$siteId]++;
        }

        // Noms des sites
        \$stmtSites = \$sqlite->prepare("SELECT id, name FROM sites WHERE service_id = ? AND source_module != 'FACTURATION'");
        \$stmtSites->execute([\$service_id]);
        \$sitesData = \$stmtSites->fetchAll() ?: [];
        \$siteNames = [];
        foreach (\$sitesData as \$s) {
            \$siteNames[\$s['id']] = \$s['name'];
        }

        \$agentsBySiteFormatted = [];
        foreach (\$agentsBySiteCounts as \$siteId => \$total) {
            \$name = \$siteNames[\$siteId] ?? \$siteId;
            if (\$siteId === 'site_extras') \$name = 'Vivier Extras';
            if (\$siteId === 'site_releves') \$name = 'Vivier Relèves';
            if (\$siteId === 'site_administration') \$name = 'Administration';
            \$agentsBySiteFormatted[] = ['name' => \$name, 'value' => \$total];
        }

        // 3. Évolution masse salariale (6 derniers mois — estimation rapide par nombre d'agents)
        \$salaryFluctuation = [];
        \$monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        for (\$i = 5; \$i >= 0; \$i--) {
            \$pastDate = date('Y-m', strtotime("-\$i months"));
            \$pastYear = date('Y', strtotime("-\$i months"));
            \$pastMonth = (int)date('m', strtotime("-\$i months")) - 1;
            \$label = \$monthNames[\$pastMonth] . ' ' . substr(\$pastYear, 2);

            // Compter les agents actifs pour ce mois
            \$stmtPast = \$sqlite->prepare("SELECT COUNT(*) as cnt FROM agents WHERE service_id = ? AND (archived_period IS NULL OR archived_period >= ?)");
            \$stmtPast->execute([\$service_id, \$pastDate]);
            \$pastRow = \$stmtPast->fetch();
            \$pastCount = (int)(\$pastRow['cnt'] ?? 0);

            // Estimation : nombre d'agents * salaire moyen (75000 par défaut)
            \$avgSalary = 75000;
            if (!empty(\$salary_config_raw)) {
                \$vals = array_values(\$salary_config_raw);
                \$numericVals = array_filter(\$vals, 'is_numeric');
                if (!empty(\$numericVals)) {
                    \$avgSalary = (int)(array_sum(\$numericVals) / count(\$numericVals));
                }
            }
            \$salaryFluctuation[] = ['month' => \$label, 'MasseSalariale' => \$pastCount * \$avgSalary];
        }

        // Formater la masse salariale
        \$masseSalarialeLabel = \$totalMasseSalariale;
        if (\$totalMasseSalariale >= 1000000) {
            \$masseSalarialeLabel = round(\$totalMasseSalariale / 1000000, 1) . 'M';
        } elseif (\$totalMasseSalariale >= 1000) {
            \$masseSalarialeLabel = round(\$totalMasseSalariale / 1000, 0) . 'K';
        }

        echo json_encode([
            'success' => true,
            'period' => \$period,
            'totalAgents' => \$totalAgents,
            'presenceRate' => \$presenceRate,
            'totalAbsences' => \$totalAbsences,
            'masseSalariale' => \$totalMasseSalariale,
            'masseSalarialeLabel' => \$masseSalarialeLabel,
            'agentsBySite' => \$agentsBySiteFormatted,
            'monthlyAttendance' => \$monthlyAttendance,
            'salaryFluctuation' => \$salaryFluctuation
        ]);
        break;

    case 'archive_pointage':
        \$sqlite = getDb();
        \$company_id = resolveCurrentCompanyIdSql();
        \$period = \$_POST['period'] ?? '';
        \$data = \$_POST['data'] ?? '';
        \$user_id = \$_SESSION['user']['id'] ?? '';
        
        \$archived_by = 'Auto-Archivage (PC)';
        if (\$user_id) {
            \$stmtU = \$sqlite->prepare("SELECT first_name, last_name FROM users WHERE id = ?");
            \$stmtU->execute([\$user_id]);
            \$u = \$stmtU->fetch();
            if (\$u) {
                \$archived_by = trim((\$u['first_name'] ?? '') . ' ' . (\$u['last_name'] ?? ''));
            }
        }

        if (!\$period || !\$data) {
            echo json_encode(['success' => false, 'message' => 'Paramètres manquants']);
            break;
        }
        
        \$now = date('Y-m-d H:i:s');

        try {
            \$stmtCheck = \$sqlite->prepare("SELECT id FROM archives_pointage WHERE company_id = ? AND period = ?");
            \$stmtCheck->execute([\$company_id, \$period]);
            \$existing = \$stmtCheck->fetch();

            if (\$existing) {
                \$stmt = \$sqlite->prepare("UPDATE archives_pointage SET archived_date = ?, archived_by = ?, data = ? WHERE id = ?");
                \$stmt->execute([\$now, \$archived_by, \$data, \$existing['id']]);
            } else {
                \$stmt = \$sqlite->prepare("INSERT INTO archives_pointage (company_id, period, archived_date, archived_by, data) VALUES (?, ?, ?, ?, ?)");
                \$stmt->execute([\$company_id, \$period, \$now, \$archived_by, \$data]);
            }
            echo json_encode(['success' => true]);
        } catch (Exception \$e) {
            echo json_encode(['success' => false, 'message' => \$e->getMessage()]);
        }
        break;

    case 'get_archives_pointage_list':
EOT;
    
    $content = substr_replace($content, $goodContent, $posStart, $posEnd - $posStart + strlen($endMarker));
    file_put_contents($file, $content);
    echo "Fixed completely!\n";
} else {
    echo "Markers not found.\n";
}
