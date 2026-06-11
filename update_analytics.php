<?php
$content = file_get_contents('api.php');

$new_analytics = <<<'EOD'
    case 'get_fluctuation_analytics':
        $period = $_GET['period'] ?? date('Y-m');
        $serviceKey = resolveCurrentServiceKeySql();
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();

        $settingsRow = getServiceDataSql($serviceKey, 'settings', ['cycle_start' => 21, 'cycle_end' => 20]);
        $start_day = (int)($settingsRow['cycle_start'] ?? 21);
        $end_day   = (int)($settingsRow['cycle_end'] ?? 20);
        $dates = getPeriodDates($period, $start_day, $end_day);
        
        $gridRaw = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id=?");
        $gridRaw->execute([$companyId]);
        $salary_config = [];
        foreach ($gridRaw->fetchAll() as $r) $salary_config[$r['poste']] = (int)$r['taux_horaire'];

        $contractsRaw = $sqlite->prepare("SELECT site_name, budget_mensuel, charges_percent, frais_fixes FROM site_contracts WHERE company_id=?");
        $contractsRaw->execute([$companyId]);
        $site_contracts = [];
        foreach ($contractsRaw->fetchAll() as $r) $site_contracts[$r['site_name']] = $r;

        $varsRaw = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $varsRaw->execute([$companyId, $period]);
        $monthly_vars = $varsRaw->fetch(PDO::FETCH_ASSOC) ?: ['primes_globales' => 0, 'charges_globales_percent' => 0];

        $stmtAg = $sqlite->prepare("SELECT a.*, s.name as site_name FROM agents a LEFT JOIN subsites sub ON a.subsite_id = sub.id LEFT JOIN sites s ON sub.site_id = s.id WHERE a.service_id = ? ORDER BY a.name");
        $stmtAg->execute([$serviceKey]);
        $allAgents = $stmtAg->fetchAll();

        $base_masse = $discipline_impact = $activite_impact = $recrutement_impact = $depart_impact = $primes_impact = $advances_impact = 0;
        $recruits_list = $departs_list = $sites_rentability = [];

        foreach ($allAgents as $agent) {
            $agent_id  = $agent['id'];
            $func_id   = $agent['function'] ?? 'AS';
            $site_name = $agent['site_name'] ?? 'Non affecté';
            $base = isset($salary_config[$func_id]) && $salary_config[$func_id] > 0 ? $salary_config[$func_id] : 75000;

            if (!isset($sites_rentability[$site_name])) {
                $sites_rentability[$site_name] = [
                    'name' => $site_name, 'agent_count' => 0, 'salary_expense' => 0,
                    'contract_revenue' => (int)($site_contracts[$site_name]['budget_mensuel'] ?? 0),
                    'charges_percent' => (float)($site_contracts[$site_name]['charges_percent'] ?? $monthly_vars['charges_globales_percent']),
                    'frais_fixes' => (int)($site_contracts[$site_name]['frais_fixes'] ?? 0)
                ];
            }
            if (!empty($agent['hire_date']) && strpos($agent['hire_date'], $period) === 0) {
                $cost = $base + (int)($agent['recruitment_cost'] ?? 0);
                $recrutement_impact += $cost;
                $recruits_list[] = ['name' => $agent['name'], 'site' => $site_name, 'cost' => $cost];
            }
            if (!empty($agent['exit_date']) && strpos($agent['exit_date'], $period) === 0) {
                $depart_impact += $base;
                $departs_list[] = ['name' => $agent['name'], 'site' => $site_name, 'savings' => $base];
                continue;
            }
            $base_masse += $base;
            $stmtAtt = $sqlite->prepare("SELECT shift_code, status FROM attendance WHERE agent_id = ? AND period = ?");
            $stmtAtt->execute([$agent_id, $period]);
            $attRows = $stmtAtt->fetchAll();
            $absences = $sp_count = 0;
            foreach ($attRows as $row) {
                if ($row['status'] === 'A') $absences++;
                if (in_array($row['shift_code'], ['S', 'SJ', 'SN']) && !in_array($row['status'], ['', 'A', 'R'])) $sp_count++;
            }
            $deductions = (int)round($absences * ($base / 30));
            $gains      = (int)round($sp_count * ($base / 30));
            $discipline_impact += $deductions;
            $activite_impact   += $gains;
            $sites_rentability[$site_name]['agent_count']++;
            $sites_rentability[$site_name]['salary_expense'] += ($base - $deductions + $gains);
        }

        $stmtAdj = $sqlite->prepare("SELECT aa.*, a.name as agent_name FROM agent_adjustments aa LEFT JOIN agents a ON aa.agent_id = a.id WHERE aa.company_id = ? AND aa.period = ?");
        $stmtAdj->execute([$companyId, $period]);
        $adjRows = $stmtAdj->fetchAll();
        $period_adjustments = [];
        foreach ($adjRows as $adj) {
            $val = (int)($adj['amount'] ?? 0);
            if (in_array($adj['type'] ?? '', ['AVANCE', 'RETENUE'])) { $advances_impact += $val; } else { $primes_impact += $val; }
            $period_adjustments[] = ['id' => $adj['id'], 'agent_id' => $adj['agent_id'], 'agent_name' => $adj['agent_name'] ?? 'Inconnu', 'type' => $adj['type'], 'value' => $val, 'comment' => $adj['comment'] ?? '', 'date_application' => $adj['date_application'] ?? ''];
        }

        $primes_impact += (int)$monthly_vars['primes_globales'];

        foreach ($sites_rentability as &$siteData) {
            $siteData['charges_patronales'] = (int)($siteData['salary_expense'] * ($siteData['charges_percent'] / 100));
            $siteData['total_cost'] = $siteData['salary_expense'] + $siteData['charges_patronales'] + $siteData['frais_fixes'];
            $siteData['net_margin'] = $siteData['contract_revenue'] - $siteData['total_cost'];
            $siteData['margin_percent'] = $siteData['contract_revenue'] > 0 ? round(($siteData['net_margin'] / $siteData['contract_revenue']) * 100, 1) : 0;
            $siteData['is_alert'] = $siteData['total_cost'] > ($siteData['contract_revenue'] * 0.8);
        }

        $total_real = $base_masse + $recrutement_impact - $depart_impact + $activite_impact - $discipline_impact + $primes_impact - $advances_impact;
        
        $total_charges = array_sum(array_column($sites_rentability, 'charges_patronales'));
        $total_frais = array_sum(array_column($sites_rentability, 'frais_fixes'));
        $total_revenues = array_sum(array_column($sites_rentability, 'contract_revenue'));
        
        $company_total_cost = $total_real + $total_charges + $total_frais;
        $company_net_margin = $total_revenues - $company_total_cost;

        echo json_encode([
            'period' => $period, 
            'base_masse_salariale' => $base_masse,
            'recrutement_impact' => $recrutement_impact, 'recruits_list' => $recruits_list,
            'depart_impact' => $depart_impact, 'departs_list' => $departs_list,
            'activite_impact' => $activite_impact, 'discipline_impact' => $discipline_impact,
            'primes_impact' => $primes_impact, 'advances_impact' => $advances_impact,
            'total_real_masse_salariale' => $total_real,
            'sites_rentability' => array_values($sites_rentability),
            'manual_adjustments' => $period_adjustments,
            'company_metrics' => [
                'total_cost' => $company_total_cost,
                'net_margin' => $company_net_margin,
                'total_revenues' => $total_revenues
            ],
            'agents' => array_map(fn($a) => ['id' => $a['id'], 'name' => $a['name'], 'site' => $a['site_name'] ?? ''], $allAgents)
        ]);
        break;
EOD;

$start = strpos($content, "case 'get_fluctuation_analytics':");
$end = strpos($content, "break;", strpos($content, "total_real_masse_salariale' => \$total_real", $start)) + 6;

$new_content = substr($content, 0, $start) . $new_analytics . substr($content, $end);
file_put_contents('api.php', $new_content);
echo "Updated get_fluctuation_analytics.\n";
