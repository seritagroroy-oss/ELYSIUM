<?php
$content = file_get_contents('api.php');

$actions_to_add = <<<'EOD'

    case 'save_salary_grid':
        if (!hasPermissionSql('can_view_salaries')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO salary_grid (company_id, poste, taux_horaire) VALUES (?, ?, ?) ON CONFLICT(company_id, poste) DO UPDATE SET taux_horaire=excluded.taux_horaire");
        foreach ($data['grid'] ?? [] as $poste => $taux) {
            $stmt->execute([$companyId, $poste, (int)$taux]);
        }
        echo json_encode(['success' => true]);
        break;

    case 'save_site_contracts':
        if (!hasPermissionSql('can_view_salaries')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $stmt = $sqlite->prepare("INSERT INTO site_contracts (company_id, site_name, budget_mensuel, charges_percent, frais_fixes) VALUES (?, ?, ?, ?, ?) ON CONFLICT(company_id, site_name) DO UPDATE SET budget_mensuel=excluded.budget_mensuel, charges_percent=excluded.charges_percent, frais_fixes=excluded.frais_fixes");
        $site_name = $data['site_name'];
        $budget = (int)($data['budget_mensuel'] ?? 0);
        $charges = (float)($data['charges_percent'] ?? 0);
        $frais = (int)($data['frais_fixes'] ?? 0);
        $stmt->execute([$companyId, $site_name, $budget, $charges, $frais]);
        echo json_encode(['success' => true]);
        break;

    case 'save_monthly_variables':
        if (!hasPermissionSql('can_view_salaries')) {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
            break;
        }
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $period = $data['period'];
        $primes = (int)($data['primes_globales'] ?? 0);
        $charges = (float)($data['charges_globales_percent'] ?? 0);
        $stmt = $sqlite->prepare("INSERT INTO monthly_variables (company_id, period, primes_globales, charges_globales_percent) VALUES (?, ?, ?, ?) ON CONFLICT(company_id, period) DO UPDATE SET primes_globales=excluded.primes_globales, charges_globales_percent=excluded.charges_globales_percent");
        $stmt->execute([$companyId, $period, $primes, $charges]);
        echo json_encode(['success' => true]);
        break;

    case 'get_compta_data':
        $companyId = $_SESSION['company_id'] ?? 'comp_default_1';
        $sqlite = getDb();
        $period = $_GET['period'] ?? date('Y-m');
        
        $grid = $sqlite->prepare("SELECT poste, taux_horaire FROM salary_grid WHERE company_id=?");
        $grid->execute([$companyId]);
        
        $contracts = $sqlite->prepare("SELECT site_name, budget_mensuel, charges_percent, frais_fixes FROM site_contracts WHERE company_id=?");
        $contracts->execute([$companyId]);
        
        $vars = $sqlite->prepare("SELECT primes_globales, charges_globales_percent FROM monthly_variables WHERE company_id=? AND period=?");
        $vars->execute([$companyId, $period]);
        
        echo json_encode([
            'success' => true,
            'grid' => $grid->fetchAll(PDO::FETCH_ASSOC),
            'contracts' => $contracts->fetchAll(PDO::FETCH_ASSOC),
            'variables' => $vars->fetch(PDO::FETCH_ASSOC) ?: ['primes_globales' => 0, 'charges_globales_percent' => 0]
        ]);
        break;

EOD;

if (strpos($content, "case 'save_salary_grid':") === false) {
    $content = str_replace("default:\n        echo json_encode(['error' => 'Action inconnue']);", $actions_to_add . "\n    default:\n        echo json_encode(['error' => 'Action inconnue']);", $content);
    file_put_contents('api.php', $content);
    echo "Added new actions to api.php\n";
} else {
    echo "Actions already exist in api.php\n";
}

